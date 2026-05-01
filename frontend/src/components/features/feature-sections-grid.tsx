import type { FeatureSection } from "../../features";

export const FeatureSectionsGrid = ({
  sections,
}: {
  sections: FeatureSection[];
}) => (
  <div className="feature-detail-grid">
    {sections.map((section) => (
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
);
