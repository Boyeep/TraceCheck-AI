import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import type {
  AzureIntegrationStatus,
  DocumentKind,
  ExtractDocumentResponse,
  SourceMode,
  TraceDocument,
} from "./types";
import { extractFields } from "./tracecheck";

const modelId =
  process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID ?? "prebuilt-read";
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim() ?? "";
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim() ?? "";

const documentLabels: Record<DocumentKind, string> = {
  deliveryNote: "Delivery Note",
  coa: "Certificate of Analysis",
  materialLabel: "Material Label",
};

let azureClient: DocumentAnalysisClient | null = null;

export const buildIntegrationStatus = (
  reason?: string,
): AzureIntegrationStatus => ({
  mode: endpoint && key ? "azure" : "fallback",
  documentIntelligenceConfigured: Boolean(endpoint && key),
  modelId,
  reason:
    reason ??
    (endpoint && key
      ? "Azure Document Intelligence is configured for binary document extraction."
      : "Azure credentials are not configured, so TraceCheck is running in safe local fallback mode."),
});

const getAzureClient = () => {
  if (!endpoint || !key) {
    return null;
  }

  if (!azureClient) {
    azureClient = new DocumentAnalysisClient(
      endpoint,
      new AzureKeyCredential(key),
    );
  }

  return azureClient;
};

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const extractRawTextFromAzureResult = (result: AnalyzeResult) => {
  if (result.content?.trim()) {
    return result.content.trim();
  }

  return (
    result.pages
      ?.flatMap((page) => page.lines?.map((line) => line.content) ?? [])
      .join("\n")
      .trim() ?? ""
  );
};

const estimateAzureConfidence = (result: AnalyzeResult) => {
  const confidences =
    result.pages?.flatMap((page) =>
      page.words
        ?.map((word) => word.confidence)
        .filter((value): value is number => typeof value === "number") ?? [],
    ) ?? [];

  if (!confidences.length) {
    return 0.9;
  }

  return average(confidences);
};

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

  return {
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
  };
};

const buildFallbackBinaryText = (fileName: string) => `FILE NAME: ${fileName}
OCR MODE: Azure Functions fallback
Hint: Configure Azure Document Intelligence to run OCR on image and PDF uploads.`;

export const isTextLikeUpload = (fileName: string, contentType: string) =>
  contentType.startsWith("text/") || /\.(txt|md|json|csv)$/i.test(fileName);

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
}): Promise<ExtractDocumentResponse> => {
  const client = getAzureClient();
  if (!client) {
    return {
      document: buildDocument({
        kind,
        fileName,
        rawText: buildFallbackBinaryText(fileName),
        sourceMode: "uploaded-binary",
        contentType: contentType || "application/octet-stream",
        confidence: 0.58,
        notes: [
          "Binary upload handled in fallback mode because Azure credentials are not configured.",
        ],
        processingSource: "function-fallback",
        serviceLabel: "Azure Functions fallback",
      }),
      integrationStatus: buildIntegrationStatus(),
    };
  }

  try {
    const poller = await client.beginAnalyzeDocument(modelId, bytes);
    const result = await poller.pollUntilDone();
    const rawText =
      extractRawTextFromAzureResult(result) || buildFallbackBinaryText(fileName);

    return {
      document: buildDocument({
        kind,
        fileName,
        rawText,
        sourceMode: "uploaded-binary",
        contentType: contentType || "application/octet-stream",
        confidence: estimateAzureConfidence(result),
        notes: [
          `Processed with Azure Document Intelligence using model ${modelId}.`,
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
      document: buildDocument({
        kind,
        fileName,
        rawText: buildFallbackBinaryText(fileName),
        sourceMode: "uploaded-binary",
        contentType: contentType || "application/octet-stream",
        confidence: 0.52,
        notes: [
          "Azure extraction failed, so TraceCheck dropped back to a safe local placeholder.",
          `Azure error: ${errorMessage}`,
        ],
        processingSource: "function-fallback",
        serviceLabel: "Azure Functions fallback",
      }),
      integrationStatus: buildIntegrationStatus(
        `Azure extraction failed and TraceCheck used fallback mode instead. ${errorMessage}`,
      ),
    };
  }
};

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
}): ExtractDocumentResponse => ({
  document: buildDocument({
    kind,
    fileName,
    rawText,
    sourceMode: "uploaded-text",
    contentType: contentType || "text/plain",
    confidence: 0.87,
    notes: ["Extracted from a text-based upload via Azure Functions."],
    processingSource: "function-text",
    serviceLabel: "Azure Functions API",
  }),
  integrationStatus: buildIntegrationStatus(),
});
