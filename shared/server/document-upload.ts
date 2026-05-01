import { documentLabels } from "../documents";
import type {
  AzureIntegrationStatus,
  DocumentKind,
  ExtractDocumentResponse,
  ExtractedFields,
  SourceMode,
  TraceDocument,
} from "../types";
import {
  analyzeBinaryDocument,
  getDocumentIntelligenceConfig,
} from "./azure-document-intelligence";

export const isTextLikeUpload = (fileName: string, contentType: string) =>
  contentType.startsWith("text/") || /\.(txt|md|json|csv)$/i.test(fileName);

export const buildFallbackBinaryText = (
  fileName: string,
  ocrModeLabel: string,
) => `FILE NAME: ${fileName}
OCR MODE: ${ocrModeLabel}
Hint: Configure Azure Document Intelligence to run OCR on image and PDF uploads.`;

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
}: {
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
}): TraceDocument => ({
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

type TraceDocumentBuilder = (options: {
  kind: DocumentKind;
  fileName: string;
  rawText: string;
  sourceMode: SourceMode;
  contentType: string;
  confidence: number;
  notes: string[];
  processingSource: TraceDocument["processingSource"];
  serviceLabel: string;
}) => Promise<TraceDocument>;

type IntegrationStatusBuilder = (reason?: string) => AzureIntegrationStatus;

export const buildTextUploadResponse = async ({
  kind,
  fileName,
  contentType,
  rawText,
  note,
  processingSource,
  serviceLabel,
  buildDocument,
  buildIntegrationStatus,
}: {
  kind: DocumentKind;
  fileName: string;
  contentType: string;
  rawText: string;
  note: string;
  processingSource: TraceDocument["processingSource"];
  serviceLabel: string;
  buildDocument: TraceDocumentBuilder;
  buildIntegrationStatus: IntegrationStatusBuilder;
}): Promise<ExtractDocumentResponse> => ({
  document: await buildDocument({
    kind,
    fileName,
    rawText,
    sourceMode: "uploaded-text",
    contentType: contentType || "text/plain",
    confidence: 0.87,
    notes: [note],
    processingSource,
    serviceLabel,
  }),
  integrationStatus: buildIntegrationStatus(),
});

export const buildBinaryUploadResponse = async ({
  kind,
  fileName,
  contentType,
  bytes,
  fallbackOcrModeLabel,
  configuredFallback,
  success,
  errorFallback,
  buildDocument,
  buildIntegrationStatus,
}: {
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
}): Promise<ExtractDocumentResponse> => {
  const { configured, modelId } = getDocumentIntelligenceConfig();
  const fallbackRawText = buildFallbackBinaryText(fileName, fallbackOcrModeLabel);
  const normalizedContentType = contentType || "application/octet-stream";

  if (!configured) {
    return {
      document: await buildDocument({
        kind,
        fileName,
        rawText: fallbackRawText,
        sourceMode: "uploaded-binary",
        contentType: normalizedContentType,
        confidence: configuredFallback.confidence,
        notes: [configuredFallback.note],
        processingSource: configuredFallback.processingSource,
        serviceLabel: configuredFallback.serviceLabel,
      }),
      integrationStatus: buildIntegrationStatus(),
    };
  }

  try {
    const ocrResult = await analyzeBinaryDocument(bytes);
    const rawText = ocrResult?.rawText || fallbackRawText;
    const confidence = ocrResult?.confidence ?? errorFallback.confidence;

    return {
      document: await buildDocument({
        kind,
        fileName,
        rawText,
        sourceMode: "uploaded-binary",
        contentType: normalizedContentType,
        confidence,
        notes: success.notes(ocrResult?.modelId ?? modelId),
        processingSource: success.processingSource,
        serviceLabel: success.serviceLabel,
      }),
      integrationStatus: buildIntegrationStatus(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Azure extraction failure.";

    return {
      document: await buildDocument({
        kind,
        fileName,
        rawText: fallbackRawText,
        sourceMode: "uploaded-binary",
        contentType: normalizedContentType,
        confidence: errorFallback.confidence,
        notes: errorFallback.notes(errorMessage),
        processingSource: errorFallback.processingSource,
        serviceLabel: errorFallback.serviceLabel,
      }),
      integrationStatus: buildIntegrationStatus(
        `Azure extraction failed and TraceCheck used fallback mode instead. ${errorMessage}`,
      ),
    };
  }
};
