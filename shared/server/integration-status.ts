import type {
  AzureIntegrationReadiness,
  AzureIntegrationStatus,
  IntegrationMode,
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

const hasAzureOpenAiSupport = ({
  openAiConfigured,
  strategy,
}: {
  openAiConfigured: boolean;
  strategy: ModelLayerStrategy;
}) => openAiConfigured && strategy === "azure-openai";

const buildReadiness = ({
  documentIntelligenceConfigured,
  openAiConfigured,
  extractionStrategy,
  explanationStrategy,
}: {
  documentIntelligenceConfigured: boolean;
  openAiConfigured: boolean;
  extractionStrategy: ModelLayerStrategy;
  explanationStrategy: ModelLayerStrategy;
}): AzureIntegrationReadiness => ({
  binaryOcr: documentIntelligenceConfigured ? "azure" : "fallback",
  fieldExtraction: hasAzureOpenAiSupport({
    openAiConfigured,
    strategy: extractionStrategy,
  })
    ? "azure"
    : "fallback",
  decisionSummary: hasAzureOpenAiSupport({
    openAiConfigured,
    strategy: explanationStrategy,
  })
    ? "azure"
    : "fallback",
});

const joinWithAnd = (items: string[]) => {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
};

const getAzureOpenAiCapabilities = (readiness: AzureIntegrationReadiness) => {
  const capabilities: string[] = [];

  if (readiness.fieldExtraction === "azure") {
    capabilities.push("field extraction");
  }

  if (readiness.decisionSummary === "azure") {
    capabilities.push("decision summaries");
  }

  return capabilities;
};

const buildDefaultReason = ({
  documentIntelligenceConfigured,
  openAiConfigured,
  readiness,
}: {
  documentIntelligenceConfigured: boolean;
  openAiConfigured: boolean;
  readiness: AzureIntegrationReadiness;
}) => {
  const azureOpenAiCapabilities = getAzureOpenAiCapabilities(readiness);

  if (documentIntelligenceConfigured && azureOpenAiCapabilities.length) {
    return `Azure Document Intelligence handles OCR and Azure OpenAI augments ${joinWithAnd(azureOpenAiCapabilities)}.`;
  }

  if (documentIntelligenceConfigured) {
    return "Azure Document Intelligence is configured for binary document extraction and TraceCheck uses the rule engine for extraction and explanation.";
  }

  if (azureOpenAiCapabilities.length) {
    return `Azure OpenAI is ready for ${joinWithAnd(azureOpenAiCapabilities)}, but binary OCR still needs Azure Document Intelligence credentials.`;
  }

  if (openAiConfigured) {
    return "Azure OpenAI credentials are present, but TraceCheck is currently pinned to the deterministic rule engine.";
  }

  return "Azure credentials are not configured, so TraceCheck is running in safe local fallback mode.";
};

export const buildAzureIntegrationStatus = ({
  documentIntelligenceConfigured,
  modelId,
  modelLayerStatus = defaultModelLayerStatus,
  mode,
  reason,
}: {
  documentIntelligenceConfigured: boolean;
  modelId: string;
  modelLayerStatus?: ModelLayerStatusLike;
  mode: IntegrationMode;
  reason?: string;
}): AzureIntegrationStatus => {
  const readiness = buildReadiness({
    documentIntelligenceConfigured,
    openAiConfigured: modelLayerStatus.openAiConfigured,
    extractionStrategy: modelLayerStatus.extractionStrategy,
    explanationStrategy: modelLayerStatus.explanationStrategy,
  });

  return {
    mode,
    readiness,
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
        readiness,
      }),
  };
};
