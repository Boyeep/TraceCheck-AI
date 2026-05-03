import { Cloud, Download } from "lucide-react";
import { PanelHeader } from "../components/page";
import {
  documentKinds,
  formatReviewedAt,
  getDocumentByKind,
  reviewTheme,
  useWorkspaceFlow,
} from "../workspace";

export const WorkspaceDecisionPage = () => {
  const {
    analysis,
    documents,
    exportReport,
    integrationModeLabel,
    integrationStatus,
    recommendationConfig,
  } = useWorkspaceFlow();
  const RecommendationIcon = recommendationConfig.icon;

  return (
    <div className="workspace">
      <section className="main-column">
        <article className={`surface-card decision-card ${recommendationConfig.tone}`}>
          <div className="decision-card-top">
            <div>
              <p className="panel-label">Decision Engine</p>
              <h2>{recommendationConfig.label}</h2>
            </div>
            <RecommendationIcon size={26} />
          </div>
          <p className="decision-summary">{analysis.summary}</p>
          <div className="score-grid">
            <div>
              <span>Risk score</span>
              <strong>{analysis.riskScore}</strong>
            </div>
            <div>
              <span>AI confidence</span>
              <strong>{analysis.confidenceScore}%</strong>
            </div>
          </div>
        </article>

        <article className="surface-card">
          <PanelHeader label="Export Output" title="Generate the verification report" />
          <p className="section-copy">
            Export the current recommendation together with issue summaries,
            field-check results, and QA review status.
          </p>
          <div className="action-row">
            <button className="ghost-action" onClick={exportReport} type="button">
              <Download size={16} />
              Export report
            </button>
          </div>
        </article>
      </section>

      <aside className="side-column">
        <article className="surface-card">
          <PanelHeader label="Review Status" title="Per-document readiness" />
          <div className="workspace-mini-stack">
            {documentKinds.map((entry) => {
              const document = getDocumentByKind(documents, entry.kind);
              const reviewState = reviewTheme[document?.reviewStatus ?? "pending"];
              return (
                <div className="workspace-mini-row" key={entry.kind}>
                  <div>
                    <strong>{entry.label}</strong>
                    <span>{document ? formatReviewedAt(document.reviewedAt) : "Not loaded yet"}</span>
                  </div>
                  <span className={`workspace-mini-pill ${document ? reviewState.tone : ""}`}>
                    {document ? reviewState.label : "Missing"}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="surface-card">
          <PanelHeader label="Azure Integration" title="Backend readiness" />
          <div
            className={`integration-badge ${integrationStatus.readiness.binaryOcr === "azure" ? "is-live" : "is-fallback"}`}
          >
            <Cloud size={16} />
            {integrationModeLabel}
          </div>
          <p className="integration-note">
            {integrationStatus.reason ?? "TraceCheck is checking Azure connectivity."}
          </p>
          <div className="azure-stack">
            <div className="azure-chip">
              <Cloud size={16} />
              Azure Static Web Apps
            </div>
            <div className="azure-chip">
              <Cloud size={16} />
              Node API / Azure Functions-ready
            </div>
            <div className="azure-chip">
              <Cloud size={16} />
              Azure AI Document Intelligence
            </div>
            <div className="azure-chip">
              <Cloud size={16} />
              Model: {integrationStatus.modelId}
            </div>
          </div>
        </article>

        <article className="surface-card">
          <PanelHeader label="Final Check" title="Before sharing the result" />
          <ol className="workflow-list">
            <li>Make sure the recommendation matches the visible issues.</li>
            <li>Confirm QA review has been completed where needed.</li>
            <li>Export the report for the hackathon demo or internal handoff.</li>
          </ol>
        </article>
      </aside>
    </div>
  );
};
