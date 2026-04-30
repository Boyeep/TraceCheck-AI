import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { featureSpotlights } from "./features-content";

export const FeatureDetailPage = () => {
  const { featureSlug } = useParams();
  const feature = featureSpotlights.find((entry) => entry.slug === featureSlug);

  if (!feature) {
    return <Navigate replace to="/features" />;
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

          <div className="feature-detail-grid">
            {feature.sections.map((section) => (
              <article className="feature-card" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.copy}</p>
                <ul className="feature-list">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {feature.architectureColumns ? (
          <section className="route-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">System Shape</p>
                <h2 className="section-title">What supports this feature area.</h2>
              </div>
            </div>

            <div className="architecture-grid">
              {feature.architectureColumns.map((column) => (
                <article className="architecture-card" key={column.title}>
                  <h3>{column.title}</h3>
                  <ul className="feature-list">
                    {column.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="route-section feature-nav-section">
          <div className="feature-next-row">
            <Link className="inline-link" to="/features">
              <ArrowLeft size={16} />
              Back to feature hub
            </Link>
            <Link className="site-pill site-pill-light" to={feature.nextHref}>
              {feature.nextLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};
