import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { issueTone, useWorkspaceFlow } from "../workspace";

export const WorkspaceValidatePage = () => {
  const { analysis } = useWorkspaceFlow();

  return (
    <div className="workspace">
      <section className="main-column">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <p className="panel-label">Cross-Document Validation</p>
              <h2>Field-by-field consistency matrix</h2>
            </div>
          </div>

          {analysis.fieldChecks.length ? (
            <div className="matrix-table">
              <div className="matrix-header">
                <span>Field</span>
                <span>Delivery Note</span>
                <span>Certificate of Analysis</span>
                <span>Material Label</span>
                <span>Verdict</span>
              </div>
              {analysis.fieldChecks.map((check) => (
                <div className="matrix-row" key={check.key}>
                  <span className="field-name">{check.label}</span>
                  <span className="matrix-cell">
                    {check.values.deliveryNote ?? "N/A"}
                  </span>
                  <span className="matrix-cell">{check.values.coa ?? "N/A"}</span>
                  <span className="matrix-cell">
                    {check.values.materialLabel ?? "N/A"}
                  </span>
                  <span className={`verdict-pill verdict-${check.verdict}`}>
                    {check.verdict}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Upload the material documents to generate the validation matrix.</p>
            </div>
          )}
        </article>
      </section>

      <aside className="side-column">
        <article className="surface-card">
          <div className="section-heading">
            <div>
              <p className="panel-label">Risk Flags</p>
              <h2>What needs attention</h2>
            </div>
          </div>
          <div className="issue-stack">
            {analysis.issues.length ? (
              analysis.issues.map((issue) => (
                <div className={`issue-card ${issueTone(issue.severity)}`} key={issue.id}>
                  <div className="issue-card-head">
                    <strong>{issue.title}</strong>
                    <span>{issue.severity}</span>
                  </div>
                  <p>{issue.detail}</p>
                </div>
              ))
            ) : (
              <div className="empty-state compact">
                <CheckCircle2 size={20} />
                <p>No issues detected.</p>
              </div>
            )}
          </div>
        </article>

        <article className="surface-card">
          <div className="section-heading">
            <div>
              <p className="panel-label">Decision Handoff</p>
              <h2>When to continue</h2>
            </div>
          </div>
          <ol className="workflow-list">
            <li>Review all mismatch, missing, and warning verdicts.</li>
            <li>Confirm which flags are acceptable and which block release.</li>
            <li>Move to the final decision page to export the recommendation.</li>
          </ol>
          <Link className="site-pill site-pill-light workspace-step-cta" to="/workspace/decision">
            Continue to decision
            <ArrowRight size={16} />
          </Link>
        </article>
      </aside>
    </div>
  );
};
