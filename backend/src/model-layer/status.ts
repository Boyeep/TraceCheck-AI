import type { ModelLayerStrategy } from "../../../shared/types";
import {
  getConfiguredModelLayer,
  getOpenAiConfig,
} from "./config";

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
