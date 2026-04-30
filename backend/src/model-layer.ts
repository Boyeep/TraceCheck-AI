import type {
  DocumentKind,
  ExtractedFields,
  ModelLayerStrategy,
  TraceAnalysis,
  TraceDocument,
  TraceFieldKey,
} from "../../shared/types";
import { extractFields, normalizeFieldValue } from "../../shared/tracecheck";

const fieldKeys: TraceFieldKey[] = [
  "materialName",
  "itemCode",
  "supplier",
  "batchNumber",
  "expiryDate",
  "quantity",
];

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

const getConfiguredModelLayer = (): ModelLayerStrategy =>
  (process.env.TRACECHECK_MODEL_LAYER ?? "rule-engine").trim() === "azure-openai"
    ? "azure-openai"
    : "rule-engine";

const getOpenAiConfig = () => {
  const endpoint = trimTrailingSlash(process.env.AZURE_OPENAI_ENDPOINT ?? "");
  const apiKey = (process.env.AZURE_OPENAI_API_KEY ?? "").trim();
  const deployment = (process.env.AZURE_OPENAI_DEPLOYMENT ?? "").trim();
  const timeoutMs = Number(process.env.AZURE_OPENAI_TIMEOUT_MS ?? "15000");

  return {
    endpoint,
    apiKey,
    deployment,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const truncateText = (value: string, limit = 12000) =>
  value.length <= limit ? value : `${value.slice(0, limit)}\n...[truncated]`;

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

const callAzureOpenAiJson = async <T>({
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

const coerceExtractedFields = (payload: unknown): ExtractedFields => {
  const source =
    isRecord(payload) && isRecord(payload.fields) ? payload.fields : payload;

  if (!isRecord(source)) {
    return {};
  }

  const fields: ExtractedFields = {};

  fieldKeys.forEach((field) => {
    const candidate = source[field];
    if (typeof candidate === "string" && candidate.trim()) {
      fields[field] = normalizeFieldValue(field, candidate);
    }
  });

  return fields;
};

export const getModelLayerStatus = () => {
  const configuredMode = getConfiguredModelLayer();
  const { endpoint, apiKey, deployment } = getOpenAiConfig();
  const openAiConfigured = Boolean(endpoint && apiKey && deployment);

  const extractionStrategy: ModelLayerStrategy =
    configuredMode === "azure-openai" && openAiConfigured
      ? "azure-openai"
      : "rule-engine";

  return {
    openAiConfigured,
    openAiDeployment: deployment || undefined,
    extractionStrategy,
    explanationStrategy: extractionStrategy,
  };
};

export const enrichExtractedFields = async ({
  kind,
  rawText,
}: {
  kind: DocumentKind;
  rawText: string;
}): Promise<{
  extractedFields: ExtractedFields;
  notes: string[];
  serviceLabel?: string;
}> => {
  const regexFields = extractFields(rawText);
  const { extractionStrategy } = getModelLayerStatus();

  if (extractionStrategy === "rule-engine") {
    return {
      extractedFields: regexFields,
      notes: [],
    };
  }

  try {
    const completion = await callAzureOpenAiJson<{
      fields?: Record<string, unknown>;
      explanation?: string;
    }>({
      systemPrompt:
        "You extract traceability fields from pharma incoming-material documents for QA verification. Only return fields that are explicitly supported by the source text. Use null when a field is missing. Normalize dates to YYYY-MM-DD when possible.",
      userPrompt: JSON.stringify({
        task: "extract_traceability_fields",
        documentKind: kind,
        fields: fieldKeys,
        rawText: truncateText(rawText),
      }),
      maxTokens: 500,
    });

    const llmFields = coerceExtractedFields(completion);
    const extractedFields = {
      ...regexFields,
      ...llmFields,
    };

    const notes = ["Field extraction was enhanced with Azure OpenAI JSON extraction."];
    if (typeof completion.explanation === "string" && completion.explanation.trim()) {
      notes.push(`Azure OpenAI note: ${completion.explanation.trim()}`);
    }

    return {
      extractedFields,
      notes,
      serviceLabel: "Azure OpenAI + rule engine",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Azure OpenAI extraction failure.";

    return {
      extractedFields: regexFields,
      notes: [
        "Azure OpenAI extraction was unavailable, so TraceCheck used the rule engine fallback.",
        `Azure OpenAI error: ${message}`,
      ],
    };
  }
};

export const explainAnalysis = async ({
  analysis,
  documents,
}: {
  analysis: TraceAnalysis;
  documents: TraceDocument[];
}): Promise<TraceAnalysis> => {
  const { explanationStrategy } = getModelLayerStatus();

  if (explanationStrategy === "rule-engine") {
    return {
      ...analysis,
      summarySource: "rule-engine",
    };
  }

  try {
    const completion = await callAzureOpenAiJson<{
      summary?: string;
    }>({
      systemPrompt:
        "You explain QA release recommendations for pharma incoming-material checks. Return JSON with a concise summary field. Keep the explanation to one or two plain-language sentences with no markdown.",
      userPrompt: JSON.stringify({
        task: "summarize_tracecheck_decision",
        recommendation: analysis.recommendation,
        riskScore: analysis.riskScore,
        confidenceScore: analysis.confidenceScore,
        matchedFieldCount: analysis.matchedFieldCount,
        issues: analysis.issues.map((issue) => ({
          severity: issue.severity,
          title: issue.title,
          detail: issue.detail,
          field: issue.field,
        })),
        fieldChecks: analysis.fieldChecks.map((check) => ({
          field: check.label,
          verdict: check.verdict,
          detail: check.detail,
        })),
        documents: documents.map((document) => ({
          label: document.label,
          fileName: document.displayName,
          source: document.processingSource ?? "unknown",
        })),
      }),
      maxTokens: 220,
    });

    if (typeof completion.summary === "string" && completion.summary.trim()) {
      return {
        ...analysis,
        summary: completion.summary.trim(),
        summarySource: "azure-openai",
      };
    }
  } catch {
    // Safe fallback to the deterministic summary.
  }

  return {
    ...analysis,
    summarySource: "rule-engine",
  };
};
