import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { FeatureSpotlight } from "../../features";

export const FeatureRouteCard = ({
  feature,
}: {
  feature: FeatureSpotlight;
}) => {
  const Icon = feature.icon;

  return (
    <article className="feature-route-card">
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
};
