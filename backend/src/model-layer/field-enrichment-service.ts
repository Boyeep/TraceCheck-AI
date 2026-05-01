import type {
  DocumentKind,
  ExtractedFields,
} from "../../../shared/types";
import {
  extractFields,
  normalizeFieldValue,
  traceFieldKeys,
} from "../../../shared/tracecheck";
import { callAzureOpenAiJson } from "./azure-openai-client";
import { truncateText } from "./config";
import { getModelLayerStatus } from "./status";
import { isRecord } from "./utils";

const coerceExtractedFields = (payload: unknown): ExtractedFields => {
  const source =
    isRecord(payload) && isRecord(payload.fields) ? payload.fields : payload;

  if (!isRecord(source)) {
    return {};
  }

  const fields: ExtractedFields = {};

  traceFieldKeys.forEach((field) => {
    const candidate = source[field];
    if (typeof candidate === "string" && candidate.trim()) {
      fields[field] = normalizeFieldValue(field, candidate);
    }
  });

  return fields;
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
        fields: traceFieldKeys,
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
