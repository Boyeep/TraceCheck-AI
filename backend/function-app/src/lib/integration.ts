import type {
  DocumentKind,
  SourceMode,
  TraceDocument,
} from "../../../../shared/types";
import { extractFields } from "../../../../shared/tracecheck";
import {
  buildBinaryUploadResponse,
  buildTextUploadResponse,
  createTraceDocument,
  isTextLikeUpload,
} from "../../../../shared/server/document-upload";
import { buildAzureIntegrationStatus } from "../../../../shared/server/integration-status";
import { getDocumentIntelligenceConfig } from "../../../../shared/server/azure-document-intelligence";

const buildDocument = ({
  kind,
  fileName,
  rawText,
  sourceMode,
  contentType,
  confidence,
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
  notes: string[];
  processingSource: TraceDocument["processingSource"];
  serviceLabel: string;
}): TraceDocument => {
  const extractedFields = extractFields(rawText);

  return createTraceDocument({
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
  });
};

export const buildIntegrationStatus = (reason?: string) => {
  const { configured, modelId } = getDocumentIntelligenceConfig();

  return buildAzureIntegrationStatus({
    documentIntelligenceConfigured: configured,
    modelId,
    reason,
  });
};

export const extractDocumentFromBinary = async ({
  kind,
  fileName,
  contentType,
  bytes,
}: {
  kind: DocumentKind;
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
}) =>
  buildBinaryUploadResponse({
    kind,
    fileName,
    contentType,
    bytes,
    fallbackOcrModeLabel: "Azure Functions fallback",
    configuredFallback: {
      confidence: 0.58,
      note: "Binary upload handled in fallback mode because Azure credentials are not configured.",
      processingSource: "function-fallback",
      serviceLabel: "Azure Functions fallback",
    },
    success: {
      notes: (modelId) => [
        `Processed with Azure Document Intelligence using model ${modelId}.`,
        "Field extraction still uses TraceCheck's domain rules after OCR completes.",
      ],
      processingSource: "azure-document-intelligence",
      serviceLabel: "Azure Document Intelligence",
    },
    errorFallback: {
      confidence: 0.52,
      notes: (errorMessage) => [
        "Azure extraction failed, so TraceCheck dropped back to a safe local placeholder.",
        `Azure error: ${errorMessage}`,
      ],
      processingSource: "function-fallback",
      serviceLabel: "Azure Functions fallback",
    },
    buildDocument: async (options) => buildDocument(options),
    buildIntegrationStatus,
  });

export const extractDocumentFromText = ({
  kind,
  fileName,
  contentType,
  rawText,
}: {
  kind: DocumentKind;
  fileName: string;
  contentType: string;
  rawText: string;
}) =>
  buildTextUploadResponse({
    kind,
    fileName,
    contentType,
    rawText,
    note: "Extracted from a text-based upload via Azure Functions.",
    processingSource: "function-text",
    serviceLabel: "Azure Functions API",
    buildDocument: async (options) => buildDocument(options),
    buildIntegrationStatus,
  });
