import { documentLabels } from "./documents";
import type {
  DocumentKind,
  ExtractedFields,
  SourceMode,
  TraceDocument,
} from "./types";

export type CreateTraceDocumentOptions = {
  kind: DocumentKind;
  fileName: string;
  rawText: string;
  sourceMode: SourceMode;
  contentType: string;
  confidence: number;
  extractedFields: ExtractedFields;
  notes: string[];
  processingSource: TraceDocument["processingSource"];
  serviceLabel: string;
};

export const createTraceDocument = ({
  kind,
  fileName,
  rawText,
  sourceMode,
  contentType,
  confidence,
  extractedFields,
  notes,
  processingSource,
  serviceLabel,
}: CreateTraceDocumentOptions): TraceDocument => ({
  id: `${kind}-${crypto.randomUUID()}`,
  kind,
  label: documentLabels[kind],
  displayName: fileName,
  rawText,
  sourceMode,
  contentType,
  confidence,
  extractedFields,
  ocrExtractedFields: extractedFields,
  notes,
  processingSource,
  serviceLabel,
  reviewStatus: "pending",
});
