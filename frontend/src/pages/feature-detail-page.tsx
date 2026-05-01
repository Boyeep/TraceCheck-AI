import { Navigate, useParams } from "react-router-dom";
import { FeatureArchitectureGrid } from "../components/features/feature-architecture-grid";
import { FeaturePageNav } from "../components/features/feature-page-nav";
import { FeatureSectionsGrid } from "../components/features/feature-sections-grid";
import { getFeatureSpotlightBySlug } from "../features";
import { routePaths } from "../routes";

export const FeatureDetailPage = () => {
  const { featureSlug } = useParams();
  const feature = getFeatureSpotlightBySlug(featureSlug);

  if (!feature) {
    return <Navigate replace to={routePaths.features} />;
  }

  const Icon = feature.icon;

  return (
    <main className="route-main">
      <div className="page-shell page-top-shell">
        <section className="route-section">
          <div className="section-header">
            <div>
              <p className="eyebrow">Inside This Area</p>
              <h2 className="section-title">How this part of TraceCheck behaves.</h2>
            </div>
            <div className="feature-icon feature-detail-icon">
              <Icon size={18} />
            </div>
          </div>

          <FeatureSectionsGrid sections={feature.sections} />
        </section>

        {feature.architectureColumns ? (
          <section className="route-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">System Shape</p>
                <h2 className="section-title">What supports this feature area.</h2>
              </div>
            </div>

            <FeatureArchitectureGrid columns={feature.architectureColumns} />
          </section>
        ) : null}

        <section className="route-section feature-nav-section">
          <FeaturePageNav nextHref={feature.next.href} nextLabel={feature.next.label} />
        </section>
      </div>
    </main>
  );
};
