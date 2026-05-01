import { Link } from "react-router-dom";
import { routePaths } from "../../routes";
import { joinClasses } from "./navbar-utils";

export const SiteNavbarBrand = ({
  hasScrolled,
}: {
  hasScrolled: boolean;
}) => (
  <Link
    aria-label="Go to the TraceCheck AI homepage"
    className="site-brand"
    to={routePaths.home}
  >
    <div className={joinClasses("site-brand-mark", hasScrolled && "is-scrolled")}>
      <img
        alt="TraceCheck AI logo"
        className="site-brand-mark-image"
        src="/Logo-Mark.png"
      />
    </div>
    <div className="site-brand-copy">
      <span className="site-brand-name">TraceCheck AI</span>
      <span className="site-brand-tag">Pharma Receiving QA</span>
    </div>
  </Link>
);
