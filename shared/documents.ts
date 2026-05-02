import type { DocumentKind } from "./types/primitives";

export const documentKinds: DocumentKind[] = [
  "deliveryNote",
  "coa",
  "materialLabel",
];

export const documentLabels: Record<DocumentKind, string> = {
  deliveryNote: "Delivery Note",
  coa: "Certificate of Analysis",
  materialLabel: "Material Label",
};

export const isDocumentKind = (value: string): value is DocumentKind =>
  documentKinds.includes(value as DocumentKind);
