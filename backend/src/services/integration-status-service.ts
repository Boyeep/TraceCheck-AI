import type {
  AzureIntegrationStatus,
  IntegrationMode,
} from "../../../shared/types";
import { getDocumentIntelligenceConfig } from "../../../shared/server/azure-document-intelligence";
import { buildAzureIntegrationStatus } from "../../../shared/server/integration-status";
import { getModelLayerStatus } from "../model-layer";

type BuildIntegrationStatusOptions = {
  mode?: IntegrationMode;
  reason?: string;
};

export const buildIntegrationStatus = (
  options: BuildIntegrationStatusOptions = {},
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

  return buildAzureIntegrationStatus({
    documentIntelligenceConfigured,
    modelId,
    mode: options.mode ?? (documentIntelligenceConfigured ? "azure" : "fallback"),
    modelLayerStatus: {
      openAiConfigured,
      openAiDeployment,
      extractionStrategy,
      explanationStrategy,
    },
    reason: options.reason,
  });
};
