import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { routePaths } from "../../routes";

type FeaturePageNavProps = {
  nextHref: string;
  nextLabel: string;
};

export const FeaturePageNav = ({
  nextHref,
  nextLabel,
}: FeaturePageNavProps) => (
  <div className="feature-next-row">
    <Link className="inline-link" to={routePaths.features}>
      <ArrowLeft size={16} />
      Back to feature hub
    </Link>
    <Link className="site-pill site-pill-light" to={nextHref}>
      {nextLabel}
      <ArrowRight size={16} />
    </Link>
  </div>
);
