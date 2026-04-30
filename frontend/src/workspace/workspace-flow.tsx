import {
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  analyzeDocumentsWithApi,
  extractDocumentWithApi,
  fetchIntegrationStatus,
} from "../api/client";
import type {
  AzureIntegrationStatus,
  DocumentKind,
  ExtractedFields,
  Recommendation,
  ReviewStatus,
  TraceAnalysis,
  TraceDocument,
  TraceFieldKey,
  ValidationIssue,
} from "../../../shared/types";
import {
  analyzeDocuments,
  createEmptyAnalysis,
  normalizeFieldValue,
  prepareDocumentForReview,
} from "../../../shared/tracecheck";

export const documentKinds: {
  kind: DocumentKind;
  label: string;
  helper: string;
}[] = [
  {
    kind: "deliveryNote",
    label: "Delivery Note",
    helper: "Supplier intake document",
  },
  {
    kind: "coa",
    label: "Certificate of Analysis",
    helper: "QA certificate from the supplier",
  },
  {
    kind: "materialLabel",
    label: "Material Label",
    helper: "Label image or OCR output from the drum or pallet",
  },
];

export const fieldOrder: TraceFieldKey[] = [
  "materialName",
  "itemCode",
  "supplier",
  "batchNumber",
  "expiryDate",
  "quantity",
];

export const fieldLabels: Record<TraceFieldKey, string> = {
  materialName: "Material name",
  itemCode: "Item code",
  supplier: "Supplier",
  batchNumber: "Batch number",
  expiryDate: "Expiry date",
  quantity: "Quantity",
};

export const recommendationTheme: Record<
  Recommendation,
  { label: string; tone: string; icon: typeof ShieldCheck }
> = {
  release: {
    label: "Release",
    tone: "is-release",
    icon: ShieldCheck,
  },
  "manual-review": {
    label: "Manual review",
    tone: "is-review",
    icon: ClipboardCheck,
  },
  hold: {
    label: "Hold",
    tone: "is-hold",
    icon: ShieldAlert,
  },
};

export const reviewTheme: Record<ReviewStatus, { label: string; tone: string }> = {
  pending: {
    label: "Pending review",
    tone: "is-pending",
  },
  edited: {
    label: "Edited",
    tone: "is-edited",
  },
  approved: {
    label: "Approved",
    tone: "is-approved",
  },
};

const fallbackIntegrationStatus: AzureIntegrationStatus = {
  mode: "fallback",
  documentIntelligenceConfigured: false,
  openAiConfigured: false,
  modelId: "prebuilt-read",
  extractionStrategy: "rule-engine",
  explanationStrategy: "rule-engine",
  reason:
    "Checking backend connectivity. If the API is unavailable, TraceCheck safely stays in local fallback mode.",
};

const createDownloadUrl = (content: string) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  return URL.createObjectURL(blob);
};

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

export const countDocumentOverrides = (document: TraceDocument) =>
  countOverridesFromFields(document.extractedFields, document.ocrExtractedFields ?? {});

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

const buildReviewedDocument = (
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

type WorkspaceFlowContextValue = {
  documents: TraceDocument[];
  analysis: TraceAnalysis;
  integrationStatus: AzureIntegrationStatus;
  isProcessing: boolean;
  statusMessage: string;
  recommendationConfig: (typeof recommendationTheme)[Recommendation];
  integrationModeLabel: string;
  reviewSummary: ReturnType<typeof getReviewSummary>;
  updateDocument: (kind: DocumentKind, file?: File) => Promise<void>;
  updateReviewedField: (
    documentId: string,
    field: TraceFieldKey,
    value: string,
  ) => void;
  restoreFieldToOcr: (documentId: string, field: TraceFieldKey) => void;
  resetDocumentToOcr: (documentId: string) => void;
  approveDocumentReview: (documentId: string) => void;
  resetWorkspace: () => void;
  exportReport: () => void;
  getDocumentByKind: (kind: DocumentKind) => TraceDocument | undefined;
};

const WorkspaceFlowContext = createContext<WorkspaceFlowContextValue | null>(null);

export const WorkspaceFlowProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<TraceDocument[]>([]);
  const [analysis, setAnalysis] = useState<TraceAnalysis>(createEmptyAnalysis());
  const [integrationStatus, setIntegrationStatus] = useState<AzureIntegrationStatus>(
    fallbackIntegrationStatus,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Upload the delivery note, COA, and material label to begin the verification run.",
  );

  useEffect(() => {
    void fetchIntegrationStatus().then((status) => {
      startTransition(() => {
        setIntegrationStatus(status);
      });
    });
  }, []);

  const syncLocalAnalysis = (
    nextDocuments: TraceDocument[],
    nextStatusMessage?: string,
  ) => {
    setDocuments(nextDocuments);
    setAnalysis(analyzeDocuments(nextDocuments));

    if (nextStatusMessage) {
      setStatusMessage(nextStatusMessage);
    }
  };

  const refreshAnalysis = async (nextDocuments: TraceDocument[]) => {
    setIsProcessing(true);
    const result = await analyzeDocumentsWithApi(nextDocuments);
    startTransition(() => {
      setAnalysis(result.analysis);
      setIntegrationStatus(result.integrationStatus);
    });
    setIsProcessing(false);
  };

  const resetWorkspace = () => {
    setDocuments([]);
    setAnalysis(createEmptyAnalysis());
    setStatusMessage(
      "Workspace cleared. Upload live supplier documents to start a new verification run.",
    );
  };

  const updateDocument = async (kind: DocumentKind, file?: File) => {
    if (!file) {
      return;
    }

    setIsProcessing(true);
    const result = await extractDocumentWithApi(kind, file);
    const nextDocument = prepareDocumentForReview(result.document);
    const nextDocuments = [
      ...documents.filter((document) => document.kind !== kind),
      nextDocument,
    ].sort(
      (left, right) =>
        documentKinds.findIndex((entry) => entry.kind === left.kind) -
        documentKinds.findIndex((entry) => entry.kind === right.kind),
    );

    syncLocalAnalysis(
      nextDocuments,
      `${nextDocument.label} updated via ${nextDocument.serviceLabel ?? "TraceCheck API"}. Review the extracted fields below before approval.`,
    );
    setIntegrationStatus(result.integrationStatus);
    setIsProcessing(false);
    void refreshAnalysis(nextDocuments);
  };

  const updateReviewedField = (
    documentId: string,
    field: TraceFieldKey,
    value: string,
  ) => {
    const nextDocuments = documents.map((document) => {
      if (document.id !== documentId) {
        return document;
      }

      const normalizedValue = normalizeFieldValue(field, value);
      const nextFields = { ...document.extractedFields };

      if (normalizedValue) {
        nextFields[field] = normalizedValue;
      } else {
        delete nextFields[field];
      }

      return buildReviewedDocument(document, nextFields);
    });

    syncLocalAnalysis(
      nextDocuments,
      "Manual review in progress. TraceCheck is recalculating the recommendation from the verified values.",
    );
  };

  const restoreFieldToOcr = (documentId: string, field: TraceFieldKey) => {
    const nextDocuments = documents.map((document) => {
      if (document.id !== documentId) {
        return document;
      }

      const nextFields = { ...document.extractedFields };
      const ocrValue = document.ocrExtractedFields?.[field];

      if (ocrValue) {
        nextFields[field] = ocrValue;
      } else {
        delete nextFields[field];
      }

      return buildReviewedDocument(document, nextFields);
    });

    syncLocalAnalysis(
      nextDocuments,
      "The selected field was restored to the original OCR output.",
    );
  };

  const resetDocumentToOcr = (documentId: string) => {
    const targetDocument = documents.find((document) => document.id === documentId);
    if (!targetDocument) {
      return;
    }

    const nextDocuments = documents.map((document) => {
      if (document.id !== documentId) {
        return document;
      }

      return {
        ...document,
        extractedFields: { ...(document.ocrExtractedFields ?? {}) },
        reviewStatus: "pending" as ReviewStatus,
        reviewedAt: undefined,
      };
    });

    syncLocalAnalysis(
      nextDocuments,
      `${targetDocument.label} was reset to the original OCR output.`,
    );
  };

  const approveDocumentReview = (documentId: string) => {
    const targetDocument = documents.find((document) => document.id === documentId);
    if (!targetDocument) {
      return;
    }

    const nextDocuments = documents.map((document) =>
      document.id === documentId
        ? {
            ...document,
            reviewStatus: "approved" as ReviewStatus,
            reviewedAt: new Date().toISOString(),
          }
        : document,
    );

    syncLocalAnalysis(
      nextDocuments,
      `${targetDocument.label} approved. Low-confidence OCR flags are cleared while cross-document discrepancies remain visible.`,
    );
  };

  const exportReport = () => {
    const reportLines = [
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

    const url = createDownloadUrl(reportLines);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `tracecheck-report-${Date.now()}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const recommendationConfig = recommendationTheme[analysis.recommendation];
  const integrationModeLabel =
    integrationStatus.mode === "azure" ? "Azure live mode" : "Fallback mode";
  const reviewSummary = getReviewSummary(documents);

  const value: WorkspaceFlowContextValue = {
    documents,
    analysis,
    integrationStatus,
    isProcessing,
    statusMessage,
    recommendationConfig,
    integrationModeLabel,
    reviewSummary,
    updateDocument,
    updateReviewedField,
    restoreFieldToOcr,
    resetDocumentToOcr,
    approveDocumentReview,
    resetWorkspace,
    exportReport,
    getDocumentByKind: (kind) =>
      documents.find((document) => document.kind === kind),
  };

  return (
    <WorkspaceFlowContext.Provider value={value}>
      {children}
    </WorkspaceFlowContext.Provider>
  );
};

export const useWorkspaceFlow = () => {
  const context = useContext(WorkspaceFlowContext);

  if (!context) {
    throw new Error("useWorkspaceFlow must be used inside WorkspaceFlowProvider.");
  }

  return context;
};
