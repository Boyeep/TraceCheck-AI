import type {
  AzureIntegrationStatus,
  ModelLayerStrategy,
} from "../types";

type ModelLayerStatusLike = {
  openAiConfigured: boolean;
  openAiDeployment?: string;
  extractionStrategy: ModelLayerStrategy;
  explanationStrategy: ModelLayerStrategy;
};

const defaultModelLayerStatus: ModelLayerStatusLike = {
  openAiConfigured: false,
  extractionStrategy: "rule-engine",
  explanationStrategy: "rule-engine",
};

const buildDefaultReason = ({
  documentIntelligenceConfigured,
  openAiConfigured,
  extractionStrategy,
}: {
  documentIntelligenceConfigured: boolean;
  openAiConfigured: boolean;
  extractionStrategy: ModelLayerStrategy;
}) => {
  if (documentIntelligenceConfigured && openAiConfigured) {
    return extractionStrategy === "azure-openai"
      ? "Azure Document Intelligence handles OCR and Azure OpenAI augments field extraction plus decision summaries."
      : "Azure Document Intelligence is configured for OCR while TraceCheck keeps the deterministic rule engine active.";
  }

  if (documentIntelligenceConfigured) {
    return "Azure Document Intelligence is configured for binary document extraction and TraceCheck uses the rule engine for extraction and explanation.";
  }

  if (openAiConfigured) {
    return extractionStrategy === "azure-openai"
      ? "Azure OpenAI is configured for extraction and explanation, but binary OCR still needs Azure Document Intelligence credentials."
      : "Azure OpenAI credentials are present, but TraceCheck is currently pinned to the deterministic rule engine.";
  }

  return "Azure credentials are not configured, so TraceCheck is running in safe local fallback mode.";
};

export const buildAzureIntegrationStatus = ({
  documentIntelligenceConfigured,
  modelId,
  modelLayerStatus = defaultModelLayerStatus,
  reason,
}: {
  documentIntelligenceConfigured: boolean;
  modelId: string;
  modelLayerStatus?: ModelLayerStatusLike;
  reason?: string;
}): AzureIntegrationStatus => ({
  mode:
    documentIntelligenceConfigured || modelLayerStatus.openAiConfigured
      ? "azure"
      : "fallback",
  documentIntelligenceConfigured,
  openAiConfigured: modelLayerStatus.openAiConfigured,
  openAiDeployment: modelLayerStatus.openAiDeployment,
  modelId,
  extractionStrategy: modelLayerStatus.extractionStrategy,
  explanationStrategy: modelLayerStatus.explanationStrategy,
  reason:
    reason ??
    buildDefaultReason({
      documentIntelligenceConfigured,
      openAiConfigured: modelLayerStatus.openAiConfigured,
      extractionStrategy: modelLayerStatus.extractionStrategy,
    }),
});
