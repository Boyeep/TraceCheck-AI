import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SiteActionLinks } from "./navbar/site-action-links";
import { SiteMobileMenu } from "./navbar/site-mobile-menu";
import { SiteNavLinks } from "./navbar/site-nav-links";
import { SiteNavbarBrand } from "./navbar/site-navbar-brand";
import { joinClasses } from "./navbar/navbar-utils";
import { useNavbarSurface } from "./navbar/use-navbar-surface";

export const SiteNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { hasScrolled, shellStyle } = useNavbarSurface(isMobileMenuOpen);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="site-nav-frame">
      <div className="site-nav-pad">
        <div className="site-nav-shell" style={shellStyle}>
          <div className="site-nav-brand-row">
            <SiteNavbarBrand hasScrolled={hasScrolled} />

            <button
              aria-controls="mobile-nav-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className={joinClasses("site-nav-toggle", hasScrolled && "is-scrolled")}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              type="button"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <SiteNavLinks variant="desktop" />

          <SiteActionLinks className="site-nav-actions" />

          <SiteMobileMenu isOpen={isMobileMenuOpen} />
        </div>
      </div>
    </div>
  );
};
