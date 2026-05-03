import type { ExtractDocumentResponse } from "../../types";
import type { TextUploadResponseOptions } from "./types";

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
}: TextUploadResponseOptions): Promise<ExtractDocumentResponse> => {
  const document = await buildDocument({
    kind,
    fileName,
    rawText,
    sourceMode: "uploaded-text",
    contentType: contentType || "text/plain",
    confidence: 0.87,
    notes: [note],
    processingSource,
    serviceLabel,
  });

  return {
    document,
    integrationStatus: buildIntegrationStatus({
      mode:
        document.processingSource === "azure-openai-extraction"
          ? "azure"
          : "fallback",
    }),
  };
};
