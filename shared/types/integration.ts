import type {
  IntegrationMode,
  ModelLayerStrategy,
} from "./primitives";

export interface AzureIntegrationReadiness {
  binaryOcr: IntegrationMode;
  fieldExtraction: IntegrationMode;
  decisionSummary: IntegrationMode;
}

export interface AzureIntegrationStatus {
  mode: IntegrationMode;
  readiness: AzureIntegrationReadiness;
  documentIntelligenceConfigured: boolean;
  openAiConfigured: boolean;
  openAiDeployment?: string;
  modelId: string;
  extractionStrategy: ModelLayerStrategy;
  explanationStrategy: ModelLayerStrategy;
  reason?: string;
}
