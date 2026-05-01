import { Navigate, useParams } from "react-router-dom";
import { FeatureArchitectureGrid } from "../components/features/feature-architecture-grid";
import { FeaturePageNav } from "../components/features/feature-page-nav";
import { FeatureSectionsGrid } from "../components/features/feature-sections-grid";
import { PageSectionHeader } from "../components/page";
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
          <PageSectionHeader
            aside={(
              <div className="feature-icon feature-detail-icon">
                <Icon size={18} />
              </div>
            )}
            eyebrow="Inside This Area"
            title="How this part of TraceCheck behaves."
          />

          <FeatureSectionsGrid sections={feature.sections} />
        </section>

        {feature.architectureColumns ? (
          <section className="route-section">
            <PageSectionHeader
              eyebrow="System Shape"
              title="What supports this feature area."
            />

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
