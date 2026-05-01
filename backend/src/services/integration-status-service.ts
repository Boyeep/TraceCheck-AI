import type { AzureIntegrationStatus } from "../../../shared/types";
import { getDocumentIntelligenceConfig } from "../../../shared/server/azure-document-intelligence";
import { buildAzureIntegrationStatus } from "../../../shared/server/integration-status";
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

  return buildAzureIntegrationStatus({
    documentIntelligenceConfigured,
    modelId,
    modelLayerStatus: {
      openAiConfigured,
      openAiDeployment,
      extractionStrategy,
      explanationStrategy,
    },
    reason,
  });
};
