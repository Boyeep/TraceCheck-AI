import type {
  AnalyzeDocumentsResponse,
  AzureIntegrationStatus,
  DocumentKind,
  ExtractDocumentResponse,
  SourceMode,
  TraceDocument,
} from "../../../shared/types";
import {
  analyzeDocuments,
  createEmptyAnalysis,
  extractFields,
  prepareDocumentForReview,
} from "../../../shared/tracecheck";

const documentLabels: Record<DocumentKind, string> = {
  deliveryNote: "Delivery Note",
  coa: "Certificate of Analysis",
  materialLabel: "Material Label",
};

const configuredApiBaseUrl = (import.meta.env.VITE_TRACECHECK_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

const buildApiUrl = (path: string) =>
  configuredApiBaseUrl ? `${configuredApiBaseUrl}${path}` : path;

const unreachableApiLabel = configuredApiBaseUrl
  ? `The configured TraceCheck API at ${configuredApiBaseUrl} could not be reached, so the frontend is using the local fallback path.`
  : "The TraceCheck API could not be reached, so the frontend is using the local fallback path.";

const defaultStatus: AzureIntegrationStatus = {
  mode: "fallback",
  documentIntelligenceConfigured: false,
  openAiConfigured: false,
  modelId: "prebuilt-read",
  extractionStrategy: "rule-engine",
  explanationStrategy: "rule-engine",
  reason: unreachableApiLabel,
};

const isTextLikeUpload = (fileName: string, contentType: string) =>
  contentType.startsWith("text/") || /\.(txt|md|json|csv)$/i.test(fileName);

const createLocalDocument = async (
  kind: DocumentKind,
  file: File,
): Promise<TraceDocument> => {
  const sourceMode: SourceMode = isTextLikeUpload(file.name, file.type)
    ? "uploaded-text"
    : "uploaded-binary";

  if (sourceMode === "uploaded-text") {
    const rawText = await file.text();
    return prepareDocumentForReview({
      id: `${kind}-${crypto.randomUUID()}`,
      kind,
      label: documentLabels[kind],
      displayName: file.name,
      rawText,
      sourceMode,
      contentType: file.type || "text/plain",
      confidence: 0.84,
      extractedFields: extractFields(rawText),
      notes: [
        "Processed locally in the browser because the TraceCheck API was unavailable.",
      ],
      processingSource: "server-fallback",
      serviceLabel: "Browser fallback",
    });
  }

  const rawText = `FILE NAME: ${file.name}
OCR MODE: Browser fallback
Hint: Start the TraceCheck API and configure Azure credentials to run OCR on images or PDFs.`;

  return prepareDocumentForReview({
    id: `${kind}-${crypto.randomUUID()}`,
    kind,
    label: documentLabels[kind],
    displayName: file.name,
    rawText,
    sourceMode,
    contentType: file.type || "application/octet-stream",
    confidence: 0.55,
    extractedFields: extractFields(rawText),
    notes: [
      "Binary upload stayed in fallback mode because the backend API was unavailable.",
    ],
    processingSource: "server-fallback",
    serviceLabel: "Browser fallback",
  });
};

export const fetchIntegrationStatus = async (): Promise<AzureIntegrationStatus> => {
  try {
    const response = await fetch(buildApiUrl("/api/integration/status"));
    if (!response.ok) {
      throw new Error(`Status request failed with ${response.status}`);
    }

    return (await response.json()) as AzureIntegrationStatus;
  } catch {
    return defaultStatus;
  }
};

export const extractDocumentWithApi = async (
  kind: DocumentKind,
  file: File,
): Promise<ExtractDocumentResponse> => {
  try {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch(buildApiUrl("/api/documents/extract"), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Extraction request failed with ${response.status}`);
    }

    const payload = (await response.json()) as ExtractDocumentResponse;

    return {
      ...payload,
      document: prepareDocumentForReview(payload.document),
    };
  } catch {
    return {
      document: await createLocalDocument(kind, file),
      integrationStatus: defaultStatus,
    };
  }
};

export const analyzeDocumentsWithApi = async (
  documents: TraceDocument[],
): Promise<AnalyzeDocumentsResponse> => {
  try {
    const response = await fetch(buildApiUrl("/api/analysis"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
      throw new Error(`Analysis request failed with ${response.status}`);
    }

    return (await response.json()) as AnalyzeDocumentsResponse;
  } catch {
    return {
      analysis: documents.length ? analyzeDocuments(documents) : createEmptyAnalysis(),
      integrationStatus: defaultStatus,
    };
  }
};
