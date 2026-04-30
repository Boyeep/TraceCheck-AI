export type DocumentKind = "deliveryNote" | "coa" | "materialLabel";

export type TraceFieldKey =
  | "materialName"
  | "itemCode"
  | "supplier"
  | "batchNumber"
  | "expiryDate"
  | "quantity";

export type Recommendation = "release" | "manual-review" | "hold";
export type Verdict = "match" | "warning" | "mismatch" | "missing";
export type Severity = "low" | "medium" | "high";
export type SourceMode = "uploaded-text" | "uploaded-binary";
export type ReviewStatus = "pending" | "edited" | "approved";
export type ProcessingSource =
  | "function-text"
  | "function-fallback"
  | "azure-document-intelligence";
export type IntegrationMode = "azure" | "fallback";

export interface ExtractedFields {
  materialName?: string;
  itemCode?: string;
  supplier?: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity?: string;
}

export interface TraceDocument {
  id: string;
  kind: DocumentKind;
  label: string;
  displayName: string;
  rawText: string;
  sourceMode: SourceMode;
  contentType: string;
  confidence: number;
  extractedFields: ExtractedFields;
  ocrExtractedFields?: ExtractedFields;
  notes: string[];
  processingSource?: ProcessingSource;
  serviceLabel?: string;
  reviewStatus?: ReviewStatus;
  reviewedAt?: string;
}

export interface ValidationIssue {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  field?: TraceFieldKey;
  affectedDocuments: DocumentKind[];
}

export interface FieldCheck {
  key: TraceFieldKey;
  label: string;
  verdict: Verdict;
  detail: string;
  values: Partial<Record<DocumentKind, string>>;
}

export interface TraceAnalysis {
  recommendation: Recommendation;
  riskScore: number;
  confidenceScore: number;
  fieldChecks: FieldCheck[];
  issues: ValidationIssue[];
  matchedFieldCount: number;
  generatedAt: string;
  summary: string;
}

export interface AzureIntegrationStatus {
  mode: IntegrationMode;
  documentIntelligenceConfigured: boolean;
  modelId: string;
  reason?: string;
}

export interface ExtractDocumentResponse {
  document: TraceDocument;
  integrationStatus: AzureIntegrationStatus;
}

export interface AnalyzeDocumentsResponse {
  analysis: TraceAnalysis;
  integrationStatus: AzureIntegrationStatus;
}
