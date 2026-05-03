import type {
  AzureIntegrationStatus,
  DocumentKind,
  ExtractDocumentResponse,
  IntegrationMode,
  SourceMode,
  TraceDocument,
} from "../../types";

export type TraceDocumentBuildOptions = {
  kind: DocumentKind;
  fileName: string;
  rawText: string;
  sourceMode: SourceMode;
  contentType: string;
  confidence: number;
  notes: string[];
  processingSource: TraceDocument["processingSource"];
  serviceLabel: string;
};

export type TraceDocumentBuilder = (
  options: TraceDocumentBuildOptions,
) => Promise<TraceDocument>;

export type IntegrationStatusBuilderOptions = {
  mode: IntegrationMode;
  reason?: string;
};

export type IntegrationStatusBuilder = (
  options?: IntegrationStatusBuilderOptions,
) => AzureIntegrationStatus;

export type TextUploadResponseOptions = {
  kind: DocumentKind;
  fileName: string;
  contentType: string;
  rawText: string;
  note: string;
  processingSource: TraceDocument["processingSource"];
  serviceLabel: string;
  buildDocument: TraceDocumentBuilder;
  buildIntegrationStatus: IntegrationStatusBuilder;
};

export type BinaryUploadResponseOptions = {
  kind: DocumentKind;
  fileName: string;
  contentType: string;
  bytes: Uint8Array | Buffer;
  fallbackOcrModeLabel: string;
  configuredFallback: {
    confidence: number;
    note: string;
    processingSource: TraceDocument["processingSource"];
    serviceLabel: string;
  };
  success: {
    notes: (modelId: string) => string[];
    processingSource: TraceDocument["processingSource"];
    serviceLabel: string;
  };
  errorFallback: {
    confidence: number;
    notes: (errorMessage: string) => string[];
    processingSource: TraceDocument["processingSource"];
    serviceLabel: string;
  };
  buildDocument: TraceDocumentBuilder;
  buildIntegrationStatus: IntegrationStatusBuilder;
};

export type UploadResponse = Promise<ExtractDocumentResponse>;
