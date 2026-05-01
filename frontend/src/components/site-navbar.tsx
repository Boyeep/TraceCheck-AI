import { Menu, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  routePaths,
  siteActionLinks,
  siteNavItems,
} from "../routes";

const NAV_SURFACE_START = 24;
const NAV_SURFACE_RANGE = 140;

const joinClasses = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const useScrollY = () =>
  useSyncExternalStore(
    (onStoreChange) => {
      let frame = 0;

      const handleChange = () => {
        if (frame) {
          return;
        }

        frame = window.requestAnimationFrame(() => {
          frame = 0;
          onStoreChange();
        });
      };

      window.addEventListener("scroll", handleChange, { passive: true });
      window.addEventListener("resize", handleChange);

      return () => {
        window.removeEventListener("scroll", handleChange);
        window.removeEventListener("resize", handleChange);
        if (frame) {
          window.cancelAnimationFrame(frame);
        }
      };
    },
    () => window.scrollY,
    () => 0,
  );

export const SiteNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const scrollY = useScrollY();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isAtTop = scrollY <= NAV_SURFACE_START;
  const progress = clamp((scrollY - NAV_SURFACE_START) / NAV_SURFACE_RANGE, 0, 1);
  const shouldForceMenuSurface = isMobileMenuOpen && isAtTop;
  const surfaceProgress = shouldForceMenuSurface ? 1 : progress;
  const hasScrolled = !isAtTop || shouldForceMenuSurface;

  const shellStyle = {
    maxWidth: `${mix(1280, 1060, surfaceProgress)}px`,
    padding: `${mix(0, 12, surfaceProgress)}px ${mix(0, 20, surfaceProgress)}px`,
    borderRadius: `${mix(0, 24, surfaceProgress)}px`,
    background: `linear-gradient(90deg, rgba(85, 214, 170, ${shouldForceMenuSurface ? 0.18 : mix(0, 0.14, surfaceProgress)}) 0%, rgba(63, 178, 142, ${shouldForceMenuSurface ? 0.16 : mix(0, 0.12, surfaceProgress)}) 52%, rgba(32, 96, 84, ${shouldForceMenuSurface ? 0.18 : mix(0, 0.14, surfaceProgress)}) 100%), rgba(10, 18, 18, ${shouldForceMenuSurface ? 0.9 : mix(0, 0.86, surfaceProgress)})`,
    borderColor: `rgba(163, 193, 182, ${shouldForceMenuSurface ? 0.34 : mix(0, 0.28, surfaceProgress)})`,
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, ${shouldForceMenuSurface ? 0.08 : mix(0, 0.06, surfaceProgress)}), 0 24px 54px rgba(0, 0, 0, ${shouldForceMenuSurface ? 0.26 : mix(0, 0.22, surfaceProgress)})`,
    backdropFilter: `blur(${shouldForceMenuSurface ? 24 : mix(0, 22, surfaceProgress)}px) saturate(${shouldForceMenuSurface ? 150 : mix(100, 145, surfaceProgress)}%)`,
    WebkitBackdropFilter: `blur(${shouldForceMenuSurface ? 24 : mix(0, 22, surfaceProgress)}px) saturate(${shouldForceMenuSurface ? 150 : mix(100, 145, surfaceProgress)}%)`,
    transform: `translateY(${mix(10, 0, surfaceProgress)}px)`,
  } as const;

  return (
    <div className="site-nav-frame">
      <div className="site-nav-pad">
        <div className="site-nav-shell" style={shellStyle}>
          <div className="site-nav-brand-row">
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

          <nav className="site-nav-links">
            {siteNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  joinClasses("site-nav-link", isActive && "is-active")
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="site-nav-actions">
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

          <div
            className={joinClasses(
              "site-mobile-menu",
              isMobileMenuOpen && "is-open",
            )}
            id="mobile-nav-menu"
          >
            <div className="site-mobile-menu-inner">
              <nav className="site-mobile-links">
                {siteNavItems.map((item) => (
                  <NavLink
                    className={({ isActive }) =>
                      joinClasses("site-mobile-link", isActive && "is-active")
                    }
                    key={item.to}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="site-mobile-actions">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
