import type {
  TraceAnalysis,
  TraceDocument,
} from "../../../shared/types";
import { callAzureOpenAiJson } from "./azure-openai-client";
import { getModelLayerStatus } from "./status";

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
