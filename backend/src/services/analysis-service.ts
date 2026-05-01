import type {
  TraceAnalysis,
  TraceDocument,
} from "../../../shared/types";
import {
  analyzeDocuments,
  createEmptyAnalysis,
} from "../../../shared/tracecheck";
import { explainAnalysis } from "../model-layer";

export const buildAnalysis = async (
  documents: TraceDocument[],
): Promise<TraceAnalysis> =>
  documents.length
    ? explainAnalysis({
        analysis: analyzeDocuments(documents),
        documents,
      })
    : createEmptyAnalysis();
