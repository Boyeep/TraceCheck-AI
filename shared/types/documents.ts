import type {
  DocumentKind,
  ProcessingSource,
  ReviewStatus,
  SourceMode,
} from "./primitives";

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
