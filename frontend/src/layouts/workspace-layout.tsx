import {
  AlertTriangle,
  Download,
  FileStack,
  FlaskConical,
  RefreshCcw,
  ScanSearch,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { TypedText } from "../components/typed-text";
import { WorkspaceFlowProvider, documentKinds, useWorkspaceFlow } from "../workspace/workspace-flow";

const workspaceSteps = [
  {
    to: "/workspace/upload",
    index: "01",
    label: "Upload",
    meta: "Load the source documents",
  },
  {
    to: "/workspace/review",
    index: "02",
    label: "Review",
    meta: "Correct and approve fields",
  },
  {
    to: "/workspace/validate",
    index: "03",
    label: "Validate",
    meta: "Check cross-document alignment",
  },
  {
    to: "/workspace/decision",
    index: "04",
    label: "Decision",
    meta: "Export the release recommendation",
  },
];

const WorkspaceLayoutInner = () => {
  const {
    documents,
    analysis,
    isProcessing,
    statusMessage,
    recommendationConfig,
    resetWorkspace,
    exportReport,
    reviewSummary,
  } = useWorkspaceFlow();

  const completedReviewCount = reviewSummary.approved + reviewSummary.edited;
  const RecommendationIcon = recommendationConfig.icon;

  return (
    <main className="route-main">
      <div className="page-shell workspace-page-shell">
        <section className="route-section page-hero-plain workspace-overview-header">
          <div>
            <h1 className="route-title workspace-title page-title-compact">
              Workspace
            </h1>
            <TypedText
              as="p"
              className="lede"
              cursor
              startDelay={180}
              text="Move through the verification flow one step at a time: upload the evidence, review extracted values, validate alignment, and export the final recommendation."
              typingSpeed={12}
            />
          </div>
        </section>

        <section className="route-section workspace-step-shell">
          <div className="workspace-step-head">
            <div>
              <p className="eyebrow">Flow Navigation</p>
            </div>
            <div className="action-row">
              <button
                className="ghost-action"
                disabled={isProcessing}
                onClick={resetWorkspace}
                type="button"
              >
                <RefreshCcw size={16} />
                Reset
              </button>
              <button
                className="ghost-action"
                disabled={isProcessing}
                onClick={exportReport}
                type="button"
              >
                <Download size={16} />
                Export report
              </button>
            </div>
          </div>

          <div className={`status-banner workspace-status ${isProcessing ? "is-processing" : ""}`}>
            <FlaskConical size={18} />
            <span>{statusMessage}</span>
            {isProcessing ? <strong>Processing...</strong> : null}
          </div>

          <nav className="workspace-step-nav">
            {workspaceSteps.map((step) => {
              const isComplete =
                step.to === "/workspace/upload"
                  ? documents.length === documentKinds.length
                  : step.to === "/workspace/review"
                    ? completedReviewCount > 0
                    : step.to === "/workspace/validate"
                      ? analysis.fieldChecks.length > 0
                      : documents.length > 0;

              return (
                <NavLink
                  className={({ isActive }) =>
                    [
                      "workspace-step-link",
                      isActive ? "is-active" : "",
                      isComplete ? "is-complete" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  key={step.to}
                  to={step.to}
                >
                  <span className="workspace-step-index">{step.index}</span>
                  <span className="workspace-step-copy">
                    <strong>{step.label}</strong>
                    <span>{step.meta}</span>
                  </span>
                  <span className="workspace-step-meta">
                    {isComplete ? "Ready" : "Pending"}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </section>

        <section className="metrics-grid">
          <article className="metric-card">
            <div className="metric-icon">
              <FileStack size={22} />
            </div>
            <div>
              <p className="metric-value">{documents.length}/{documentKinds.length}</p>
              <p className="metric-label">Documents loaded</p>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon">
              <ScanSearch size={22} />
            </div>
            <div>
              <p className="metric-value">{analysis.matchedFieldCount}</p>
              <p className="metric-label">Aligned field checks</p>
            </div>
          </article>
          <article className="metric-card">
            <div className="metric-icon">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="metric-value">{analysis.issues.length}</p>
              <p className="metric-label">Flags raised</p>
            </div>
          </article>
          <article className={`metric-card ${recommendationConfig.tone}`}>
            <div className="metric-icon">
              <RecommendationIcon size={22} />
            </div>
            <div>
              <p className="metric-value">{recommendationConfig.label}</p>
              <p className="metric-label">Decision</p>
            </div>
          </article>
        </section>

        <Outlet />
      </div>
    </main>
  );
};

export const WorkspaceLayout = () => (
  <WorkspaceFlowProvider>
    <WorkspaceLayoutInner />
  </WorkspaceFlowProvider>
);
