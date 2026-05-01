import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ScanSearch,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PanelHeader } from "../components/page";
import { ReviewDocumentCard } from "../components/workspace/review-document-card";
import { workspacePaths } from "../routes";
import {
  documentKinds,
  getDocumentByKind,
  useWorkspaceFlow,
} from "../workspace";

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
          <PanelHeader
            label="Extraction Review"
            title="Edit the captured fields before release"
          />

          <p className="section-copy">
            Human approval removes low-confidence OCR warnings, but it never hides
            true cross-document mismatches. Reviewers keep the final say with the
            original OCR baseline still visible on each field.
          </p>

          <div className="document-grid">
            {documentKinds.map((entry) => {
              const document = getDocumentByKind(documents, entry.kind);

              return (
                <ReviewDocumentCard
                  document={document}
                  key={entry.kind}
                  onApprove={approveDocumentReview}
                  onResetToOcr={resetDocumentToOcr}
                  onRestoreField={restoreFieldToOcr}
                  onUpdateField={updateReviewedField}
                  subtitle="No document loaded yet"
                  title={entry.label}
                />
              );
            })}
          </div>
        </article>
      </section>

      <aside className="side-column">
        <article className="surface-card">
          <PanelHeader
            label="Review Summary"
            title="How far QA review has progressed"
          />

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
          <PanelHeader label="Reviewer Guidance" title="What to check before moving on" />
          <ol className="workflow-list">
            <li>Confirm OCR values on every loaded document.</li>
            <li>Fix field misses or obvious recognition errors.</li>
            <li>Approve the documents you are satisfied with.</li>
          </ol>
          <Link
            className="site-pill site-pill-light workspace-step-cta"
            to={workspacePaths.validate}
          >
            Continue to validation
            <ArrowRight size={16} />
          </Link>
        </article>
      </aside>
    </div>
  );
};
