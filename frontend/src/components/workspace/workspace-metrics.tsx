import {
  AlertTriangle,
  FileStack,
  ScanSearch,
} from "lucide-react";
import {
  documentKinds,
  useWorkspaceFlow,
} from "../../workspace";

export const WorkspaceMetrics = () => {
  const {
    analysis,
    documents,
    recommendationConfig,
  } = useWorkspaceFlow();
  const RecommendationIcon = recommendationConfig.icon;

  return (
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
  );
};
