import type {
  ExtractedFields,
  TraceFieldKey,
} from "../types";
import {
  fieldPatterns,
  traceFieldKeys,
} from "./constants";
import { normalizeFieldValue } from "./normalize";

export const extractFields = (rawText: string): ExtractedFields => {
  const fields: ExtractedFields = {};

  traceFieldKeys.forEach((field: TraceFieldKey) => {
    const patterns = fieldPatterns[field];
    for (const pattern of patterns) {
      const match = rawText.match(pattern);
      if (match?.[1]) {
        fields[field] = normalizeFieldValue(field, match[1]);
        break;
      }
    }
  });

  return fields;
};
