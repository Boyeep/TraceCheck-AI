import type { ExtractDocumentResponse } from "../../types";
import { buildFallbackBinaryText } from "../../uploads";
import {
  analyzeBinaryDocument,
  getDocumentIntelligenceConfig,
} from "../azure-document-intelligence";
import type { BinaryUploadResponseOptions } from "./types";

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
}: BinaryUploadResponseOptions): Promise<ExtractDocumentResponse> => {
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
      integrationStatus: buildIntegrationStatus({
        mode: "fallback",
      }),
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
      integrationStatus: buildIntegrationStatus({
        mode: "azure",
      }),
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
      integrationStatus: buildIntegrationStatus({
        mode: "fallback",
        reason: `Azure extraction failed and TraceCheck used fallback mode instead. ${errorMessage}`,
      }),
    };
  }
};
