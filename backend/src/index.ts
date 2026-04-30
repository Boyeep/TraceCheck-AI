import "dotenv/config";
import express from "express";
import multer from "multer";
import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import type { AnalyzeResult } from "@azure/ai-form-recognizer";
import type {
  AnalyzeDocumentsResponse,
  AzureIntegrationStatus,
  DocumentKind,
  ExtractDocumentResponse,
  SourceMode,
  TraceDocument,
} from "../../shared/types";
import {
  analyzeDocuments,
  createEmptyAnalysis,
} from "../../shared/tracecheck";
import {
  enrichExtractedFields,
  explainAnalysis,
  getModelLayerStatus,
} from "./model-layer";

const port = Number(process.env.PORT ?? "8787");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const modelId = process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID ?? "prebuilt-read";
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim() ?? "";
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim() ?? "";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use((_, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

const documentLabels: Record<DocumentKind, string> = {
  deliveryNote: "Delivery Note",
  coa: "Certificate of Analysis",
  materialLabel: "Material Label",
};

const buildIntegrationStatus = (reason?: string): AzureIntegrationStatus => {
  const documentIntelligenceConfigured = Boolean(endpoint && key);
  const {
    openAiConfigured,
    openAiDeployment,
    extractionStrategy,
    explanationStrategy,
  } = getModelLayerStatus();

  const defaultReason = documentIntelligenceConfigured && openAiConfigured
    ? extractionStrategy === "azure-openai"
      ? "Azure Document Intelligence handles OCR and Azure OpenAI augments field extraction plus decision summaries."
      : "Azure Document Intelligence is configured for OCR while TraceCheck keeps the deterministic rule engine active."
    : documentIntelligenceConfigured
      ? "Azure Document Intelligence is configured for binary document extraction and TraceCheck uses the rule engine for extraction and explanation."
      : openAiConfigured
        ? extractionStrategy === "azure-openai"
          ? "Azure OpenAI is configured for extraction and explanation, but binary OCR still needs Azure Document Intelligence credentials."
          : "Azure OpenAI credentials are present, but TraceCheck is currently pinned to the deterministic rule engine."
        : "Azure credentials are not configured, so TraceCheck is running in safe local fallback mode.";

  return {
    mode: documentIntelligenceConfigured || openAiConfigured ? "azure" : "fallback",
    documentIntelligenceConfigured,
    openAiConfigured,
    openAiDeployment,
    modelId,
    extractionStrategy,
    explanationStrategy,
    reason: reason ?? defaultReason,
  };
};

let azureClient: DocumentAnalysisClient | null = null;

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

const isTextLikeUpload = (fileName: string, contentType: string) =>
  contentType.startsWith("text/") || /\.(txt|md|json|csv)$/i.test(fileName);

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

const buildFallbackBinaryText = (fileName: string) => `FILE NAME: ${fileName}
OCR MODE: Local fallback
Hint: Configure Azure Document Intelligence to run OCR on image and PDF uploads.`;

const extractDocumentFromUpload = async (
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

  const client = getAzureClient();
  if (!client) {
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
    const poller = await client.beginAnalyzeDocument(modelId, file.buffer);
    const result = await poller.pollUntilDone();
    const rawText = extractRawTextFromAzureResult(result) || buildFallbackBinaryText(file.originalname);
    const confidence = estimateAzureConfidence(result);

    return {
      document: await buildDocument({
        kind,
        fileName: file.originalname,
        rawText,
        sourceMode,
        contentType: file.mimetype || "application/octet-stream",
        confidence,
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

app.get("/api/integration/status", (_request, response) => {
  response.json(buildIntegrationStatus());
});

app.post("/api/documents/extract", upload.single("file"), async (request, response) => {
  const kind = request.body.kind as DocumentKind | undefined;
  const file = request.file;

  if (!kind || !(kind in documentLabels)) {
    response.status(400).json({
      message: "A valid document kind is required.",
      integrationStatus: buildIntegrationStatus(),
    });
    return;
  }

  if (!file) {
    response.status(400).json({
      message: "A file upload is required.",
      integrationStatus: buildIntegrationStatus(),
    });
    return;
  }

  const result = await extractDocumentFromUpload(kind, file);
  response.json(result);
});

app.post("/api/analysis", async (request, response) => {
  const documents = Array.isArray(request.body?.documents)
    ? (request.body.documents as TraceDocument[])
    : [];

  const analysis = documents.length
    ? await explainAnalysis({
        analysis: analyzeDocuments(documents),
        documents,
      })
    : createEmptyAnalysis();

  const payload: AnalyzeDocumentsResponse = {
    analysis,
    integrationStatus: buildIntegrationStatus(),
  };

  response.json(payload);
});

app.listen(port, () => {
  const status = buildIntegrationStatus();
  const modeLine =
    status.mode === "azure"
      ? `Azure Document Intelligence active with model ${status.modelId}.`
      : "Fallback mode active. Configure Azure credentials to enable live OCR.";

  console.log(`TraceCheck API listening on http://127.0.0.1:${port}`);
  console.log(modeLine);
});
