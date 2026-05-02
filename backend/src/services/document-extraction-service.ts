import type {
  DocumentKind,
  ExtractDocumentResponse,
  SourceMode,
  TraceDocument,
} from "../../../shared/types";
import { createTraceDocument } from "../../../shared/trace-document";
import { isTextLikeUpload } from "../../../shared/uploads";
import {
  buildBinaryUploadResponse,
  buildTextUploadResponse,
} from "../../../shared/server/document-upload";
import { enrichExtractedFields } from "../model-layer";
import { buildIntegrationStatus } from "./integration-status-service";
import type { Express } from "express";

const buildDocument = async ({
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
}): Promise<TraceDocument> => {
  const modelResult = await enrichExtractedFields({
    kind,
    rawText,
  });

  return createTraceDocument({
    kind,
    fileName,
    rawText,
    sourceMode,
    contentType,
    confidence,
    extractedFields: modelResult.extractedFields,
    notes: [...notes, ...modelResult.notes],
    processingSource:
      modelResult.serviceLabel ? "azure-openai-extraction" : processingSource,
    serviceLabel: modelResult.serviceLabel ?? serviceLabel,
  });
};

export const extractDocumentFromUpload = async (
  kind: DocumentKind,
  file: Express.Multer.File,
): Promise<ExtractDocumentResponse> => {
  const sourceMode: SourceMode = isTextLikeUpload(file.originalname, file.mimetype)
    ? "uploaded-text"
    : "uploaded-binary";

  if (sourceMode === "uploaded-text") {
    return buildTextUploadResponse({
      kind,
      fileName: file.originalname,
      contentType: file.mimetype,
      rawText: file.buffer.toString("utf-8"),
      note: "Extracted from a text-based upload via the TraceCheck API.",
      processingSource: "server-text",
      serviceLabel: "TraceCheck API",
      buildDocument,
      buildIntegrationStatus,
    });
  }

  return buildBinaryUploadResponse({
    kind,
    fileName: file.originalname,
    contentType: file.mimetype,
    bytes: file.buffer,
    fallbackOcrModeLabel: "Local fallback",
    configuredFallback: {
      confidence: 0.58,
      note: "Binary upload handled in local fallback mode because Azure credentials are not configured.",
      processingSource: "server-fallback",
      serviceLabel: "Local fallback",
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
      processingSource: "server-fallback",
      serviceLabel: "Local fallback",
    },
    buildDocument,
    buildIntegrationStatus,
  });
};
