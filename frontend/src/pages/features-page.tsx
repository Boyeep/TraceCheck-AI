import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { TypedText } from "../components/typed-text";
import { featureSpotlights } from "./features-content";

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
          {featureSpotlights.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className="feature-route-card" key={feature.slug}>
                <div className="feature-route-head">
                  <div className="feature-icon">
                    <Icon size={18} />
                  </div>
                  <p className="eyebrow">{feature.eyebrow}</p>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.summary}</p>
                <div className="feature-tag-row">
                  {feature.includes.map((item) => (
                    <span className="feature-tag" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
                <Link className="inline-link" to={feature.href}>
                  Open area
                  <ArrowRight size={16} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  </main>
);
