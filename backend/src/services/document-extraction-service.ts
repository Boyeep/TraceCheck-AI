import type { Express } from "express";
import type {
  DocumentKind,
  ExtractDocumentResponse,
  SourceMode,
  TraceDocument,
} from "../../../shared/types";
import { enrichExtractedFields } from "../model-layer";
import { analyzeBinaryDocument, getDocumentIntelligenceConfig } from "../integrations/azure-document-intelligence";
import { documentLabels } from "./document-metadata-service";
import { buildIntegrationStatus } from "./integration-status-service";

export const isTextLikeUpload = (fileName: string, contentType: string) =>
  contentType.startsWith("text/") || /\.(txt|md|json|csv)$/i.test(fileName);

const buildFallbackBinaryText = (fileName: string) => `FILE NAME: ${fileName}
OCR MODE: Local fallback
Hint: Configure Azure Document Intelligence to run OCR on image and PDF uploads.`;

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

  return {
    id: `${kind}-${crypto.randomUUID()}`,
    kind,
    label: documentLabels[kind],
    displayName: fileName,
    rawText,
    sourceMode,
    contentType,
    confidence,
    extractedFields: modelResult.extractedFields,
    ocrExtractedFields: modelResult.extractedFields,
    notes: [...notes, ...modelResult.notes],
    processingSource:
      modelResult.serviceLabel ? "azure-openai-extraction" : processingSource,
    serviceLabel: modelResult.serviceLabel ?? serviceLabel,
    reviewStatus: "pending",
  };
};

export const extractDocumentFromUpload = async (
  kind: DocumentKind,
  file: Express.Multer.File,
): Promise<ExtractDocumentResponse> => {
  const sourceMode: SourceMode = isTextLikeUpload(file.originalname, file.mimetype)
    ? "uploaded-text"
    : "uploaded-binary";

  if (sourceMode === "uploaded-text") {
    const rawText = file.buffer.toString("utf-8");

    return {
      document: await buildDocument({
        kind,
        fileName: file.originalname,
        rawText,
        sourceMode,
        contentType: file.mimetype || "text/plain",
        confidence: 0.87,
        notes: ["Extracted from a text-based upload via the TraceCheck API."],
        processingSource: "server-text",
        serviceLabel: "TraceCheck API",
      }),
      integrationStatus: buildIntegrationStatus(),
    };
  }

  const { configured } = getDocumentIntelligenceConfig();
  if (!configured) {
    return {
      document: await buildDocument({
        kind,
        fileName: file.originalname,
        rawText: buildFallbackBinaryText(file.originalname),
        sourceMode,
        contentType: file.mimetype || "application/octet-stream",
        confidence: 0.58,
        notes: [
          "Binary upload handled in local fallback mode because Azure credentials are not configured.",
        ],
        processingSource: "server-fallback",
        serviceLabel: "Local fallback",
      }),
      integrationStatus: buildIntegrationStatus(),
    };
  }

  try {
    const ocrResult = await analyzeBinaryDocument(file.buffer);
    const rawText =
      ocrResult?.rawText || buildFallbackBinaryText(file.originalname);
    const confidence = ocrResult?.confidence ?? 0.52;

    return {
      document: await buildDocument({
        kind,
        fileName: file.originalname,
        rawText,
        sourceMode,
        contentType: file.mimetype || "application/octet-stream",
        confidence,
        notes: [
          `Processed with Azure Document Intelligence using model ${ocrResult?.modelId ?? getDocumentIntelligenceConfig().modelId}.`,
          "Field extraction still uses TraceCheck's domain rules after OCR completes.",
        ],
        processingSource: "azure-document-intelligence",
        serviceLabel: "Azure Document Intelligence",
      }),
      integrationStatus: buildIntegrationStatus(),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Azure extraction failure.";

    return {
      document: await buildDocument({
        kind,
        fileName: file.originalname,
        rawText: buildFallbackBinaryText(file.originalname),
        sourceMode,
        contentType: file.mimetype || "application/octet-stream",
        confidence: 0.52,
        notes: [
          "Azure extraction failed, so TraceCheck dropped back to a safe local placeholder.",
          `Azure error: ${errorMessage}`,
        ],
        processingSource: "server-fallback",
        serviceLabel: "Local fallback",
      }),
      integrationStatus: buildIntegrationStatus(
        `Azure extraction failed and TraceCheck used fallback mode instead. ${errorMessage}`,
      ),
    };
  }
};
