import { FeatureRouteCard } from "../components/features/feature-route-card";
import { PageIntro } from "../components/page";
import { featureSpotlights } from "../features";

export const FeaturesPage = () => (
  <main className="route-main">
    <div className="page-shell page-top-shell">
      <PageIntro
        description="TraceCheck AI is organized around one workflow: extract the evidence, review the captured fields, compare the documents, and make a release-safe decision."
        title="Platform Features"
        titleClassName="page-title page-title-compact"
      />

      <section className="route-section feature-route-shell">
        <div className="feature-route-grid">
          {featureSpotlights.map((feature) => (
            <FeatureRouteCard feature={feature} key={feature.slug} />
          ))}
        </div>
      </section>
    </div>
  </main>
);
