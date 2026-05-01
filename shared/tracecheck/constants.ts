import type {
  DocumentKind,
  Recommendation,
  TraceFieldKey,
} from "../types";

export const traceFieldKeys: TraceFieldKey[] = [
  "materialName",
  "itemCode",
  "supplier",
  "batchNumber",
  "expiryDate",
  "quantity",
];

export const fieldLabels: Record<TraceFieldKey, string> = {
  materialName: "Material Name",
  itemCode: "Item Code",
  supplier: "Supplier",
  batchNumber: "Batch Number",
  expiryDate: "Expiry Date",
  quantity: "Quantity",
};

export const requiredFieldsByDocument: Record<DocumentKind, TraceFieldKey[]> = {
  deliveryNote: [
    "materialName",
    "itemCode",
    "supplier",
    "batchNumber",
    "expiryDate",
    "quantity",
  ],
  coa: ["materialName", "itemCode", "supplier", "batchNumber", "expiryDate"],
  materialLabel: [
    "materialName",
    "itemCode",
    "supplier",
    "batchNumber",
    "expiryDate",
    "quantity",
  ],
};

export const fieldPatterns: Record<TraceFieldKey, RegExp[]> = {
  materialName: [
    /(?:material|product|item|description)\s*[:#-]\s*(.+)/i,
  ],
  itemCode: [
    /(?:item code|material code|code)\s*[:#-]\s*([A-Z0-9-]+)/i,
  ],
  supplier: [
    /(?:supplier|vendor|manufacturer)\s*[:#-]\s*(.+)/i,
  ],
  batchNumber: [
    /(?:batch(?: number| no)?|lot)\s*[:#-]\s*([A-Z0-9-]+)/i,
  ],
  expiryDate: [
    /(?:exp(?:iry|iration)?(?: date)?|exp date)\s*[:#-]\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i,
  ],
  quantity: [
    /(?:qty|quantity)\s*[:#-]\s*([0-9]+(?:\.[0-9]+)?\s*[A-Z]+)/i,
  ],
};

export const recommendationLabels: Record<Recommendation, string> = {
  release: "Release",
  "manual-review": "Manual review",
  hold: "Hold",
};
