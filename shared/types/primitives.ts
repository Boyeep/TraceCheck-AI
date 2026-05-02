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
export type ModelLayerStrategy = "rule-engine" | "azure-openai";
export type ProcessingSource =
  | "function-text"
  | "function-fallback"
  | "server-text"
  | "server-fallback"
  | "azure-document-intelligence"
  | "azure-openai-extraction";
export type IntegrationMode = "azure" | "fallback";
