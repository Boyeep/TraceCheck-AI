import type {
  ExtractedFields,
  ReviewStatus,
  TraceDocument,
} from "../types";
import { traceFieldKeys } from "./constants";
import { extractFields } from "./extract";

const hasOverrides = (
  extractedFields: ExtractedFields,
  ocrExtractedFields: ExtractedFields,
) =>
  traceFieldKeys.some(
    (field) => (extractedFields[field] ?? "") !== (ocrExtractedFields[field] ?? ""),
  );

const deriveReviewStatus = (
  document: TraceDocument,
  extractedFields: ExtractedFields,
  ocrExtractedFields: ExtractedFields,
): ReviewStatus => {
  if (document.reviewStatus) {
    return document.reviewStatus;
  }

  return hasOverrides(extractedFields, ocrExtractedFields) ? "edited" : "pending";
};

export const prepareDocumentForReview = (
  document: TraceDocument,
): TraceDocument => {
  const extractedFields = Object.keys(document.extractedFields).length
    ? document.extractedFields
    : extractFields(document.rawText);
  const ocrExtractedFields = Object.keys(document.ocrExtractedFields ?? {}).length
    ? { ...document.ocrExtractedFields }
    : { ...extractedFields };

  return {
    ...document,
    extractedFields,
    ocrExtractedFields,
    reviewStatus: deriveReviewStatus(document, extractedFields, ocrExtractedFields),
  };
};
