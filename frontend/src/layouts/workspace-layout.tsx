import {
  Download,
  FlaskConical,
  RefreshCcw,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { TypedText } from "../components/typed-text";
import { WorkspaceMetrics } from "../components/workspace/workspace-metrics";
import { WorkspaceStepNav } from "../components/workspace/workspace-step-nav";
import { WorkspaceFlowProvider, useWorkspaceFlow } from "../workspace";

const WorkspaceLayoutInner = () => {
  const {
    isProcessing,
    statusMessage,
    resetWorkspace,
    exportReport,
  } = useWorkspaceFlow();

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

          <WorkspaceStepNav />
        </section>

        <WorkspaceMetrics />

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
