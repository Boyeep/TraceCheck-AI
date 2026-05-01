import type { DocumentKind } from "../../../shared/types";

export const documentLabels: Record<DocumentKind, string> = {
  deliveryNote: "Delivery Note",
  coa: "Certificate of Analysis",
  materialLabel: "Material Label",
};

export const isDocumentKind = (value: string): value is DocumentKind =>
  value in documentLabels;
