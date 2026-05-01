import type { TraceFieldKey } from "../types";

export const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, " ").trim();

export const normalizeDate = (value: string) => {
  const trimmed = normalizeWhitespace(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${year}-${month}-${day}`;
  }

  return trimmed;
};

export const normalizeFieldValue = (field: TraceFieldKey, value: string) => {
  const normalized = normalizeWhitespace(value);
  if (field === "expiryDate") {
    return normalizeDate(normalized);
  }

  if (field === "quantity") {
    return normalized.toUpperCase();
  }

  return normalized;
};
