import { Link } from "react-router-dom";
import { siteActionLinks } from "../../routes";

export const SiteActionLinks = ({
  className,
}: {
  className: string;
}) => (
  <div className={className}>
    {siteActionLinks.map((item) => (
      <Link
        className={`site-pill site-pill-${item.tone}`}
        key={item.to}
        to={item.to}
      >
        {item.label}
      </Link>
    ))}
  </div>
);
