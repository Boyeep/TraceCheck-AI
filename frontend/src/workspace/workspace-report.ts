import type {
  AzureIntegrationStatus,
  TraceAnalysis,
  TraceDocument,
} from "../../../shared/types";
import {
  documentKinds,
  recommendationTheme,
  reviewTheme,
} from "./workspace-config";
import {
  countDocumentOverrides,
  formatReviewedAt,
} from "./workspace-helpers";

type BuildWorkspaceReportOptions = {
  analysis: TraceAnalysis;
  documents: TraceDocument[];
  integrationStatus: AzureIntegrationStatus;
};

const createDownloadUrl = (content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  return URL.createObjectURL(blob);
};

export const buildWorkspaceReport = ({
  analysis,
  documents,
  integrationStatus,
}: BuildWorkspaceReportOptions) =>
  [
    "TraceCheck AI Verification Report",
    `Generated: ${new Date(analysis.generatedAt).toLocaleString()}`,
    `Recommendation: ${recommendationTheme[analysis.recommendation].label}`,
    `Risk score: ${analysis.riskScore}`,
    `Confidence score: ${analysis.confidenceScore}%`,
    `Integration mode: ${integrationStatus.mode}`,
    `Document Intelligence model: ${integrationStatus.modelId}`,
    "",
    "Summary",
    analysis.summary,
    "",
    "Document Review Status",
    ...(documents.length
      ? documents.map((document) => {
          const reviewStatus = reviewTheme[document.reviewStatus ?? "pending"];
          return `- ${document.label}: ${reviewStatus.label} | Manual overrides: ${countDocumentOverrides(document)} | Reviewed: ${formatReviewedAt(document.reviewedAt)}`;
        })
      : ["- No documents loaded."]),
    "",
    "Issues",
    ...(analysis.issues.length
      ? analysis.issues.map(
          (issue) => `- [${issue.severity.toUpperCase()}] ${issue.title}: ${issue.detail}`,
        )
      : ["- No issues detected."]),
    "",
    "Field Checks",
    ...(analysis.fieldChecks.length
      ? analysis.fieldChecks.map((check) => {
          const values = documentKinds
            .map((entry) => `${entry.label}: ${check.values[entry.kind] ?? "N/A"}`)
            .join(" | ");
          return `- ${check.label} (${check.verdict}): ${values}`;
        })
      : ["- No field checks generated yet."]),
  ].join("\n");

export const downloadWorkspaceReport = (content: string) => {
  const url = createDownloadUrl(content);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `tracecheck-report-${Date.now()}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
};
