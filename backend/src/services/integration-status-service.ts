import { createRequire } from "node:module";
import type {
  AzureIntegrationStatus,
  IntegrationMode,
} from "../../../shared/types";
import { getModelLayerStatus } from "../model-layer/status";

const require = createRequire(import.meta.url);
const { getDocumentIntelligenceConfig } = require("../../../shared/server/azure-document-intelligence") as
  typeof import("../../../shared/server/azure-document-intelligence");
const { buildAzureIntegrationStatus } = require("../../../shared/server/integration-status") as
  typeof import("../../../shared/server/integration-status");

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
