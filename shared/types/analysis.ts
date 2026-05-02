import type {
  DocumentKind,
  ModelLayerStrategy,
  Recommendation,
  Severity,
  TraceFieldKey,
  Verdict,
} from "./primitives";

export interface ValidationIssue {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  field?: TraceFieldKey;
  affectedDocuments: DocumentKind[];
}

export interface FieldCheck {
  key: TraceFieldKey;
  label: string;
  verdict: Verdict;
  detail: string;
  values: Partial<Record<DocumentKind, string>>;
}

export interface TraceAnalysis {
  recommendation: Recommendation;
  riskScore: number;
  confidenceScore: number;
  fieldChecks: FieldCheck[];
  issues: ValidationIssue[];
  matchedFieldCount: number;
  generatedAt: string;
  summary: string;
  summarySource?: ModelLayerStrategy;
}
