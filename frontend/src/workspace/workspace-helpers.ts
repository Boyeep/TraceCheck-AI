import type {
  DocumentKind,
  ExtractedFields,
  ReviewStatus,
  TraceDocument,
  TraceFieldKey,
  ValidationIssue,
} from "../../../shared/types";
import { documentKinds, fieldOrder } from "./workspace-config";

const documentKindIndexes = new Map(
  documentKinds.map((entry, index) => [entry.kind, index]),
);

const getStoredValue = (
  fields: ExtractedFields | undefined,
  field: TraceFieldKey,
) => fields?.[field]?.trim() ?? "";

const countOverridesFromFields = (
  extractedFields: ExtractedFields,
  ocrExtractedFields: ExtractedFields,
) =>
  fieldOrder.filter(
    (field) =>
      getStoredValue(extractedFields, field) !==
      getStoredValue(ocrExtractedFields, field),
  ).length;

export const sortDocumentsByKind = (documents: TraceDocument[]) =>
  [...documents].sort(
    (left, right) =>
      (documentKindIndexes.get(left.kind) ?? 0) -
      (documentKindIndexes.get(right.kind) ?? 0),
  );

export const getDocumentByKind = (
  documents: TraceDocument[],
  kind: DocumentKind,
) => documents.find((document) => document.kind === kind);

export const getProcessingLabel = (document?: TraceDocument) => {
  if (!document) {
    return "No document loaded";
  }

  switch (document.processingSource) {
    case "server-text":
      return "API text extraction";
    case "azure-document-intelligence":
      return "Azure Document Intelligence";
    case "server-fallback":
      return document.serviceLabel ?? "Fallback mode";
    default:
      return document.sourceMode === "uploaded-text"
        ? "Live text extraction"
        : "Binary upload";
  }
};

export const countDocumentOverrides = (document: TraceDocument) =>
  countOverridesFromFields(
    document.extractedFields,
    document.ocrExtractedFields ?? {},
  );

export const getReviewSummary = (documents: TraceDocument[]) => ({
  approved: documents.filter((document) => document.reviewStatus === "approved").length,
  edited: documents.filter((document) => document.reviewStatus === "edited").length,
  pending: documents.filter(
    (document) => !document.reviewStatus || document.reviewStatus === "pending",
  ).length,
  overrides: documents.reduce(
    (sum, document) => sum + countDocumentOverrides(document),
    0,
  ),
});

export const buildReviewedDocument = (
  document: TraceDocument,
  extractedFields: ExtractedFields,
): TraceDocument => {
  const reviewStatus: ReviewStatus = countOverridesFromFields(
    extractedFields,
    document.ocrExtractedFields ?? {},
  )
    ? "edited"
    : "pending";

  return {
    ...document,
    extractedFields,
    reviewStatus,
    reviewedAt: reviewStatus === "pending" ? undefined : new Date().toISOString(),
  };
};

export const formatReviewedAt = (reviewedAt?: string) =>
  reviewedAt ? new Date(reviewedAt).toLocaleString() : "Not reviewed yet";

export const issueTone = (severity: ValidationIssue["severity"]) => {
  if (severity === "high") {
    return "issue-high";
  }

  if (severity === "medium") {
    return "issue-medium";
  }

  return "issue-low";
};
