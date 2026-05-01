import { getOpenAiConfig } from "./config";
import { isRecord } from "./utils";

const buildChatCompletionsUrl = (endpoint: string) =>
  endpoint.endsWith("/openai/v1")
    ? `${endpoint}/chat/completions`
    : `${endpoint}/openai/v1/chat/completions`;

const parseChatContent = (payload: unknown) => {
  if (!isRecord(payload)) {
    throw new Error("Azure OpenAI returned an invalid payload.");
  }

  const choices = payload.choices;
  if (!Array.isArray(choices) || !choices.length) {
    throw new Error("Azure OpenAI returned no completion choices.");
  }

  const firstChoice = choices[0];
  if (!isRecord(firstChoice)) {
    throw new Error("Azure OpenAI returned a malformed completion choice.");
  }

  const message = firstChoice.message;
  if (!isRecord(message)) {
    throw new Error("Azure OpenAI returned a malformed completion message.");
  }

  const content = message.content;
  if (typeof content === "string" && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    const combined = content
      .map((item) => {
        if (!isRecord(item)) {
          return "";
        }

        return typeof item.text === "string" ? item.text : "";
      })
      .join("")
      .trim();

    if (combined) {
      return combined;
    }
  }

  throw new Error("Azure OpenAI returned an empty completion message.");
};

export const callAzureOpenAiJson = async <T>({
  systemPrompt,
  userPrompt,
  maxTokens,
}: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}): Promise<T> => {
  const { endpoint, apiKey, deployment, timeoutMs } = getOpenAiConfig();

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Azure OpenAI credentials are not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildChatCompletionsUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        model: deployment,
        response_format: {
          type: "json_object",
        },
        temperature: 0.1,
        max_tokens: maxTokens,
        messages: [
          {
            role: "system",
            content: `${systemPrompt}\nReturn valid JSON only.`,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Azure OpenAI request failed with ${response.status}. ${errorText}`.trim(),
      );
    }

    const payload = (await response.json()) as unknown;
    const content = parseChatContent(payload);
    return JSON.parse(content) as T;
  } finally {
    clearTimeout(timeoutId);
  }
};
