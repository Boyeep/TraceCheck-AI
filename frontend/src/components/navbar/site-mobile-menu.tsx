import { SiteActionLinks } from "./site-action-links";
import { SiteNavLinks } from "./site-nav-links";
import { joinClasses } from "./navbar-utils";

type SiteMobileMenuProps = {
  isOpen: boolean;
};

export const SiteMobileMenu = ({ isOpen }: SiteMobileMenuProps) => (
  <div
    className={joinClasses("site-mobile-menu", isOpen && "is-open")}
    id="mobile-nav-menu"
  >
    <div className="site-mobile-menu-inner">
      <SiteNavLinks variant="mobile" />
      <SiteActionLinks className="site-mobile-actions" />
    </div>
  </div>
);
