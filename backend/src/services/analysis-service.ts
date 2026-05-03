import { createRequire } from "node:module";
import type {
  TraceAnalysis,
  TraceDocument,
} from "../../../shared/types";
import { explainAnalysis } from "../model-layer/analysis-explainer-service";

const require = createRequire(import.meta.url);
const { analyzeDocuments, createEmptyAnalysis } = require("../../../shared/tracecheck/analyze") as
  typeof import("../../../shared/tracecheck/analyze");

export const buildAnalysis = async (
  documents: TraceDocument[],
): Promise<TraceAnalysis> =>
  documents.length
    ? explainAnalysis({
        analysis: analyzeDocuments(documents),
        documents,
      })
    : createEmptyAnalysis();
