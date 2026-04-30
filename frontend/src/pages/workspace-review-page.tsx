import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  RefreshCcw,
  ScanSearch,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  countDocumentOverrides,
  documentKinds,
  fieldLabels,
  fieldOrder,
  formatReviewedAt,
  reviewTheme,
  useWorkspaceFlow,
} from "../workspace/workspace-flow";

export const WorkspaceReviewPage = () => {
  const {
    documents,
    approveDocumentReview,
    resetDocumentToOcr,
    restoreFieldToOcr,
    reviewSummary,
    updateReviewedField,
  } = useWorkspaceFlow();

  return (
    <div className="workspace">
      <section className="main-column">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <p className="panel-label">Extraction Review</p>
              <h2>Edit the captured fields before release</h2>
            </div>
          </div>

          <p className="section-copy">
            Human approval removes low-confidence OCR warnings, but it never hides
            true cross-document mismatches. Reviewers keep the final say with the
            original OCR baseline still visible on each field.
          </p>

          <div className="document-grid">
            {documentKinds.map((entry) => {
              const document = documents.find((item) => item.kind === entry.kind);
              const reviewConfig = document
                ? reviewTheme[document.reviewStatus ?? "pending"]
                : null;

              return (
                <section
                  className={`document-card ${document ? reviewConfig?.tone : ""}`}
                  key={entry.kind}
                >
                  <div className="document-card-head">
                    <div>
                      <h3>{entry.label}</h3>
                      <p>{document?.displayName ?? "No document loaded yet"}</p>
                    </div>
                    {document ? (
                      <div className="document-card-meta">
                        <span className={`review-pill ${reviewConfig?.tone}`}>
                          {reviewConfig?.label}
                        </span>
                        <span className="confidence-chip">
                          {Math.round(document.confidence * 100)}% confidence
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {document ? (
                    <>
                      <div className="document-actions">
                        <button
                          className="mini-action"
                          disabled={document.reviewStatus === "approved"}
                          onClick={() => approveDocumentReview(document.id)}
                          type="button"
                        >
                          <CheckCircle2 size={15} />
                          Approve review
                        </button>
                        <button
                          className="mini-action"
                          disabled={!countDocumentOverrides(document)}
                          onClick={() => resetDocumentToOcr(document.id)}
                          type="button"
                        >
                          <RefreshCcw size={15} />
                          Reset to OCR
                        </button>
                      </div>

                      <p className="reviewed-at">
                        Reviewed: {formatReviewedAt(document.reviewedAt)}
                      </p>

                      <div className="field-list">
                        {fieldOrder.map((field) => {
                          const currentValue = document.extractedFields[field] ?? "";
                          const ocrValue = document.ocrExtractedFields?.[field] ?? "";
                          const isOverridden = currentValue.trim() !== ocrValue.trim();

                          return (
                            <div
                              className={`field-editor ${isOverridden ? "is-overridden" : ""}`}
                              key={field}
                            >
                              <div className="field-label-row">
                                <span>{fieldLabels[field]}</span>
                                <strong>
                                  {isOverridden ? "Manual override" : "Matches OCR"}
                                </strong>
                              </div>
                              <input
                                aria-label={`${entry.label} ${fieldLabels[field]}`}
                                className={`field-input ${isOverridden ? "is-overridden" : ""}`}
                                onChange={(event) =>
                                  updateReviewedField(
                                    document.id,
                                    field,
                                    event.target.value,
                                  )
                                }
                                placeholder="Not found"
                                type="text"
                                value={currentValue}
                              />
                              <div className="field-helper-row">
                                <span className="field-helper">
                                  OCR baseline: {ocrValue || "No OCR value detected"}
                                </span>
                                {isOverridden ? (
                                  <button
                                    className="field-restore"
                                    onClick={() => restoreFieldToOcr(document.id, field)}
                                    type="button"
                                  >
                                    Restore field
                                  </button>
                                ) : (
                                  <span className="field-helper subtle">
                                    Verified output is aligned with the captured OCR field.
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <ul className="note-list">
                        {document.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="empty-card">
                      <FileSearch size={24} />
                      <p>This slot is waiting for a document.</p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </article>
      </section>

      <aside className="side-column">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <p className="panel-label">Review Summary</p>
              <h2>How far QA review has progressed</h2>
            </div>
          </div>

          <div className="review-summary">
            <div className="review-chip is-approved">
              <CheckCircle2 size={14} />
              {reviewSummary.approved} approved
            </div>
            <div className="review-chip is-edited">
              <ClipboardCheck size={14} />
              {reviewSummary.edited} edited
            </div>
            <div className="review-chip is-pending">
              <AlertTriangle size={14} />
              {reviewSummary.pending} pending
            </div>
            <div className="review-chip is-neutral">
              <ScanSearch size={14} />
              {reviewSummary.overrides} manual overrides
            </div>
          </div>
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <p className="panel-label">Reviewer Guidance</p>
              <h2>What to check before moving on</h2>
            </div>
          </div>
          <ol className="workflow-list">
            <li>Confirm OCR values on every loaded document.</li>
            <li>Fix field misses or obvious recognition errors.</li>
            <li>Approve the documents you are satisfied with.</li>
          </ol>
          <Link className="site-pill site-pill-light workspace-step-cta" to="/workspace/validate">
            Continue to validation
            <ArrowRight size={16} />
          </Link>
        </article>
      </aside>
    </div>
  );
};
