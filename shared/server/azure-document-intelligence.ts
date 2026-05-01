import {
  AzureKeyCredential,
  DocumentAnalysisClient,
} from "@azure/ai-form-recognizer";
import type { AnalyzeResult } from "@azure/ai-form-recognizer";

const modelId =
  process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID ?? "prebuilt-read";
const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT?.trim() ?? "";
const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY?.trim() ?? "";

let azureClient: DocumentAnalysisClient | null = null;

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

export const getDocumentIntelligenceConfig = () => ({
  configured: Boolean(endpoint && key),
  modelId,
});

export const analyzeBinaryDocument = async (bytes: Uint8Array | Buffer) => {
  const client = getAzureClient();
  if (!client) {
    return null;
  }

  const poller = await client.beginAnalyzeDocument(modelId, bytes);
  const result = await poller.pollUntilDone();

  return {
    rawText: extractRawTextFromAzureResult(result),
    confidence: estimateAzureConfidence(result),
    modelId,
  };
};
