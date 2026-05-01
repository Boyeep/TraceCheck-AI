import { FeatureRouteCard } from "../components/features/feature-route-card";
import { TypedText } from "../components/typed-text";
import { featureSpotlights } from "../features";

export const FeaturesPage = () => (
  <main className="route-main">
    <div className="page-shell page-top-shell">
      <section className="route-section page-hero-plain">
        <h1 className="route-title page-title page-title-compact">
          Platform Features
        </h1>
        <TypedText
          as="p"
          className="lede"
          cursor
          startDelay={180}
          text="TraceCheck AI is organized around one workflow: extract the evidence, review the captured fields, compare the documents, and make a release-safe decision."
          typingSpeed={12}
        />
      </section>

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
