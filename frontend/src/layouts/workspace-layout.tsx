import {
  Download,
  FlaskConical,
  RefreshCcw,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import {
  PageIntro,
  PageSectionHeader,
} from "../components/page";
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
        <PageIntro
          description="Move through the verification flow one step at a time: upload the evidence, review extracted values, validate alignment, and export the final recommendation."
          sectionClassName="workspace-overview-header"
          title="Workspace"
          titleClassName="workspace-title page-title-compact"
        />

        <section className="route-section workspace-step-shell">
          <PageSectionHeader
            aside={(
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
            )}
            className="workspace-step-head"
            eyebrow="Flow Navigation"
          />

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
