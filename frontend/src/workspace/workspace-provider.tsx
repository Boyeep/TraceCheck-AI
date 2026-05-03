import {
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ApiRequestError,
  analyzeDocumentsWithApi,
  defaultIntegrationStatus,
  extractDocumentWithApi,
  fetchIntegrationStatus,
} from "../api/client";
import { useAuth } from "../auth/auth-context";
import type {
  AzureIntegrationStatus,
  DocumentKind,
  Recommendation,
  TraceAnalysis,
  TraceDocument,
  TraceFieldKey,
} from "../../../shared/types";
import {
  analyzeDocuments,
  createEmptyAnalysis,
  normalizeFieldValue,
} from "../../../shared/tracecheck";
import {
  documentKinds,
  initialWorkspaceStatusMessage,
  recommendationTheme,
  resetWorkspaceStatusMessage,
} from "./workspace-config";
import {
  buildReviewedDocument,
  getDocumentByKind as findDocumentByKind,
  getReviewSummary,
  sortDocumentsByKind,
} from "./workspace-helpers";
import {
  buildWorkspaceReport,
  downloadWorkspaceReport,
} from "./workspace-report";

export type WorkspaceFlowContextValue = {
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
  const { signOut } = useAuth();
  const [documents, setDocuments] = useState<TraceDocument[]>([]);
  const [analysis, setAnalysis] = useState<TraceAnalysis>(createEmptyAnalysis());
  const [integrationStatus, setIntegrationStatus] = useState<AzureIntegrationStatus>(
    defaultIntegrationStatus,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(initialWorkspaceStatusMessage);

  const handleAuthFailure = async (error: unknown) => {
    if (
      error instanceof ApiRequestError &&
      (error.statusCode === 401 || error.statusCode === 403)
    ) {
      await signOut().catch(() => undefined);
      return true;
    }

    return false;
  };

  useEffect(() => {
    void fetchIntegrationStatus()
      .then((status) => {
        startTransition(() => {
          setIntegrationStatus(status);
        });
      })
      .catch((error) => {
        void handleAuthFailure(error);
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
    try {
      const result = await analyzeDocumentsWithApi(nextDocuments);
      startTransition(() => {
        setAnalysis(result.analysis);
        setIntegrationStatus(result.integrationStatus);
      });
    } catch (error) {
      await handleAuthFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWorkspace = () => {
    setDocuments([]);
    setAnalysis(createEmptyAnalysis());
    setStatusMessage(resetWorkspaceStatusMessage);
  };

  const updateDocument = async (kind: DocumentKind, file?: File) => {
    if (!file) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await extractDocumentWithApi(kind, file);
      const nextDocuments = sortDocumentsByKind([
        ...documents.filter((document) => document.kind !== kind),
        result.document,
      ]);

      syncLocalAnalysis(
        nextDocuments,
        `${result.document.label} updated via ${result.document.serviceLabel ?? "TraceCheck API"}. Review the extracted fields below before approval.`,
      );
      startTransition(() => {
        setIntegrationStatus(result.integrationStatus);
      });
      void refreshAnalysis(nextDocuments);
    } catch (error) {
      await handleAuthFailure(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateReviewedField = (
    documentId: string,
    field: TraceFieldKey,
    value: string,
  ) => {
    const nextDocuments = documents.map((document): TraceDocument => {
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
    const nextDocuments = documents.map((document): TraceDocument => {
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

    const nextDocuments = documents.map((document): TraceDocument => {
      if (document.id !== documentId) {
        return document;
      }

      return {
        ...document,
        extractedFields: { ...(document.ocrExtractedFields ?? {}) },
        reviewStatus: "pending",
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

    const nextDocuments = documents.map((document): TraceDocument =>
      document.id === documentId
        ? {
            ...document,
            reviewStatus: "approved",
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
    downloadWorkspaceReport(
      buildWorkspaceReport({
        analysis,
        documents,
        integrationStatus,
      }),
    );
  };

  const recommendationConfig = recommendationTheme[analysis.recommendation];
  const integrationModeLabel =
    integrationStatus.readiness.binaryOcr === "azure"
      ? "Azure OCR ready"
      : "Fallback OCR mode";
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
    getDocumentByKind: (kind) => findDocumentByKind(documents, kind),
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
