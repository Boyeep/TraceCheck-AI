import type {
  IntegrationMode,
  ModelLayerStrategy,
} from "./primitives";

export interface AzureIntegrationStatus {
  mode: IntegrationMode;
  documentIntelligenceConfigured: boolean;
  openAiConfigured: boolean;
  openAiDeployment?: string;
  modelId: string;
  extractionStrategy: ModelLayerStrategy;
  explanationStrategy: ModelLayerStrategy;
  reason?: string;
}
