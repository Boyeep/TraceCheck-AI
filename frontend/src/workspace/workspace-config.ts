import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type {
  DocumentKind,
  Recommendation,
  ReviewStatus,
  TraceFieldKey,
} from "../../../shared/types";
import { workspacePaths } from "../routes";

export type WorkspaceDocumentKind = {
  kind: DocumentKind;
  label: string;
  helper: string;
};

export type WorkspaceStep = {
  to: string;
  index: string;
  label: string;
  meta: string;
};

export type RecommendationTheme = {
  label: string;
  tone: string;
  icon: LucideIcon;
};

export type ReviewTheme = {
  label: string;
  tone: string;
};

export const documentKinds: WorkspaceDocumentKind[] = [
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

export const documentKindLabels = Object.fromEntries(
  documentKinds.map(({ kind, label }) => [kind, label]),
) as Record<DocumentKind, string>;

export const workspaceSteps: WorkspaceStep[] = [
  {
    to: workspacePaths.upload,
    index: "01",
    label: "Upload",
    meta: "Load the source documents",
  },
  {
    to: workspacePaths.review,
    index: "02",
    label: "Review",
    meta: "Correct and approve fields",
  },
  {
    to: workspacePaths.validate,
    index: "03",
    label: "Validate",
    meta: "Check cross-document alignment",
  },
  {
    to: workspacePaths.decision,
    index: "04",
    label: "Decision",
    meta: "Export the release recommendation",
  },
];

export const workspaceUploadAccept = ".txt,.md,.json,.csv,image/*,.pdf";

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

export const recommendationTheme: Record<Recommendation, RecommendationTheme> = {
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

export const reviewTheme: Record<ReviewStatus, ReviewTheme> = {
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

export const initialWorkspaceStatusMessage =
  "Upload the delivery note, COA, and material label to begin the verification run.";

export const resetWorkspaceStatusMessage =
  "Workspace cleared. Upload live supplier documents to start a new verification run.";
