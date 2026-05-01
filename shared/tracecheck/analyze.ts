import type {
  FieldCheck,
  Recommendation,
  TraceAnalysis,
  TraceDocument,
  TraceFieldKey,
  ValidationIssue,
  Verdict,
} from "../types";
import {
  fieldLabels,
  recommendationLabels,
  requiredFieldsByDocument,
  traceFieldKeys,
} from "./constants";
import { prepareDocumentForReview } from "./review";

const buildFieldCheck = (
  key: TraceFieldKey,
  documents: TraceDocument[],
): FieldCheck => {
  const values = Object.fromEntries(
    documents
      .map((document) => [document.kind, document.extractedFields[key]])
      .filter((entry) => Boolean(entry[1])),
  );

  const presentValues = Object.values(values).map((value) => value?.toString() ?? "");
  const uniqueValues = [...new Set(presentValues)];
  const missingCount = documents.length - presentValues.length;

  let verdict: Verdict = "match";
  let detail = "All available documents align.";

  if (uniqueValues.length > 1) {
    verdict = "mismatch";
    detail = "At least one document disagrees with the others.";
  } else if (missingCount > 0) {
    verdict = "missing";
    detail = "One or more documents are missing this required field.";
  }

  if (key === "expiryDate" && uniqueValues.length === 1 && uniqueValues[0]) {
    const expiry = new Date(uniqueValues[0]);
    const today = new Date();
    const diffMs = expiry.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 90) {
      verdict = "warning";
      detail = "The material expires within the next 90 days.";
    }
  }

  return {
    key,
    label: fieldLabels[key],
    verdict,
    detail,
    values,
  };
};

const buildIssues = (
  documents: TraceDocument[],
  fieldChecks: FieldCheck[],
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  documents.forEach((document) => {
    const requiredFields = requiredFieldsByDocument[document.kind];
    requiredFields.forEach((field) => {
      if (!document.extractedFields[field]) {
        issues.push({
          id: `${document.id}-${field}-missing`,
          severity: "medium",
          title: `${document.label} is missing ${fieldLabels[field]}`,
          detail:
            "The extraction layer could not find this field, so the batch should be reviewed before release.",
          field,
          affectedDocuments: [document.kind],
        });
      }
    });

    if (document.confidence < 0.85 && document.reviewStatus !== "approved") {
      issues.push({
        id: `${document.id}-confidence`,
        severity: "low",
        title: `${document.label} has lower extraction confidence`,
        detail:
          "The local prototype recommends a quick manual check when OCR confidence drops below 85%. Approve the document after review to clear this flag.",
        affectedDocuments: [document.kind],
      });
    }
  });

  fieldChecks.forEach((check) => {
    if (check.verdict === "mismatch") {
      issues.push({
        id: `${check.key}-mismatch`,
        severity:
          check.key === "expiryDate" || check.key === "batchNumber"
            ? "high"
            : "medium",
        title: `${check.label} mismatch detected`,
        detail:
          check.key === "expiryDate"
            ? "Expiry values differ across documents, creating a compliance and traceability risk."
            : "The same material field does not match across all available documents.",
        field: check.key,
        affectedDocuments: documents
          .filter((document) => Boolean(document.extractedFields[check.key]))
          .map((document) => document.kind),
      });
    }

    if (check.verdict === "warning") {
      issues.push({
        id: `${check.key}-warning`,
        severity: "medium",
        title: `${check.label} is approaching expiry`,
        detail:
          "The material expiry window is short enough to justify manual confirmation before release.",
        field: check.key,
        affectedDocuments: documents.map((document) => document.kind),
      });
    }
  });

  return issues;
};

const summarise = (
  recommendation: Recommendation,
  issues: ValidationIssue[],
  matchedFieldCount: number,
) => {
  const issueCount = issues.length;
  const label = recommendationLabels[recommendation];

  if (recommendation === "hold") {
    return `${label} recommended because ${issueCount} validation issue${issueCount === 1 ? "" : "s"} were detected, including at least one critical discrepancy. ${matchedFieldCount} fields still matched cleanly.`;
  }

  if (recommendation === "manual-review") {
    return `${label} recommended because the documents are mostly aligned but still contain review-worthy extraction or data quality warnings. ${matchedFieldCount} fields matched cleanly.`;
  }

  return `${label} recommended. All critical fields align across the available documents, with ${matchedFieldCount} field checks passing cleanly.`;
};

export const createEmptyAnalysis = (): TraceAnalysis => ({
  recommendation: "manual-review",
  riskScore: 100,
  confidenceScore: 0,
  fieldChecks: [],
  issues: [],
  matchedFieldCount: 0,
  generatedAt: new Date().toISOString(),
  summary:
    "No documents are currently loaded. Upload the incoming material documents to generate a TraceCheck decision.",
});

export const analyzeDocuments = (documents: TraceDocument[]): TraceAnalysis => {
  if (!documents.length) {
    return createEmptyAnalysis();
  }

  const hydratedDocuments = documents.map((document) =>
    prepareDocumentForReview(document),
  );

  const fieldChecks = traceFieldKeys.map((key) =>
    buildFieldCheck(key, hydratedDocuments),
  );

  const issues = buildIssues(hydratedDocuments, fieldChecks);
  const matchedFieldCount = fieldChecks.filter(
    (fieldCheck) => fieldCheck.verdict === "match",
  ).length;

  const confidenceScore = Math.round(
    (hydratedDocuments.reduce((sum, document) => sum + document.confidence, 0) /
      hydratedDocuments.length) *
      100,
  );

  const riskPenalty = issues.reduce((sum, issue) => {
    if (issue.severity === "high") {
      return sum + 30;
    }

    if (issue.severity === "medium") {
      return sum + 12;
    }

    return sum + 5;
  }, 0);

  const riskScore = Math.max(8, 100 - riskPenalty);

  let recommendation: Recommendation = "release";
  if (issues.some((issue) => issue.severity === "high")) {
    recommendation = "hold";
  } else if (issues.length > 0 || confidenceScore < 88) {
    recommendation = "manual-review";
  }

  return {
    recommendation,
    riskScore,
    confidenceScore,
    fieldChecks,
    issues,
    matchedFieldCount,
    generatedAt: new Date().toISOString(),
    summary: summarise(recommendation, issues, matchedFieldCount),
  };
};
