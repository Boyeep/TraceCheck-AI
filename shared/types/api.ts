import type { TraceAnalysis } from "./analysis";
import type { TraceDocument } from "./documents";
import type { AzureIntegrationStatus } from "./integration";

export interface ExtractDocumentResponse {
  document: TraceDocument;
  integrationStatus: AzureIntegrationStatus;
}

export interface AnalyzeDocumentsResponse {
  analysis: TraceAnalysis;
  integrationStatus: AzureIntegrationStatus;
}
