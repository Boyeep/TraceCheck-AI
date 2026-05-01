import type { AzureIntegrationStatus } from "../../../shared/types";
import { getDocumentIntelligenceConfig } from "../integrations/azure-document-intelligence";
import { getModelLayerStatus } from "../model-layer";

export const buildIntegrationStatus = (
  reason?: string,
): AzureIntegrationStatus => {
  const {
    configured: documentIntelligenceConfigured,
    modelId,
  } = getDocumentIntelligenceConfig();
  const {
    openAiConfigured,
    openAiDeployment,
    extractionStrategy,
    explanationStrategy,
  } = getModelLayerStatus();

  const defaultReason = documentIntelligenceConfigured && openAiConfigured
    ? extractionStrategy === "azure-openai"
      ? "Azure Document Intelligence handles OCR and Azure OpenAI augments field extraction plus decision summaries."
      : "Azure Document Intelligence is configured for OCR while TraceCheck keeps the deterministic rule engine active."
    : documentIntelligenceConfigured
      ? "Azure Document Intelligence is configured for binary document extraction and TraceCheck uses the rule engine for extraction and explanation."
      : openAiConfigured
        ? extractionStrategy === "azure-openai"
          ? "Azure OpenAI is configured for extraction and explanation, but binary OCR still needs Azure Document Intelligence credentials."
          : "Azure OpenAI credentials are present, but TraceCheck is currently pinned to the deterministic rule engine."
        : "Azure credentials are not configured, so TraceCheck is running in safe local fallback mode.";

  return {
    mode: documentIntelligenceConfigured || openAiConfigured ? "azure" : "fallback",
    documentIntelligenceConfigured,
    openAiConfigured,
    openAiDeployment,
    modelId,
    extractionStrategy,
    explanationStrategy,
    reason: reason ?? defaultReason,
  };
};
