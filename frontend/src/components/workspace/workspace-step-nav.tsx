import { NavLink } from "react-router-dom";
import { workspacePaths } from "../../routes";
import {
  documentKinds,
  useWorkspaceFlow,
  workspaceSteps,
} from "../../workspace";

export const WorkspaceStepNav = () => {
  const { analysis, documents, reviewSummary } = useWorkspaceFlow();
  const completedReviewCount = reviewSummary.approved + reviewSummary.edited;

  return (
    <nav className="workspace-step-nav">
      {workspaceSteps.map((step) => {
        const isComplete =
          step.to === workspacePaths.upload
            ? documents.length === documentKinds.length
            : step.to === workspacePaths.review
              ? completedReviewCount > 0
              : step.to === workspacePaths.validate
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
  );
};
