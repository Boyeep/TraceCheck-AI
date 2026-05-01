import { Link, Outlet } from "react-router-dom";
import { SiteNavbar } from "../components/site-navbar";
import { footerNavItems } from "../routes";

export const SiteLayout = () => (
  <div className="site-root">
    <SiteNavbar />
    <Outlet />
    <footer className="site-footer">
      <div className="page-shell site-footer-shell">
        <div>
          <p className="eyebrow">TraceCheck AI</p>
          <p className="footer-copy">
            Incoming-material verification for pharma receiving and QA teams.
          </p>
        </div>
        <div className="footer-links">
          {footerNavItems.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  </div>
);
