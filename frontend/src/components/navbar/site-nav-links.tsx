import { NavLink } from "react-router-dom";
import { siteNavItems } from "../../routes";
import { joinClasses } from "./navbar-utils";

type SiteNavLinksProps = {
  variant: "desktop" | "mobile";
};

export const SiteNavLinks = ({ variant }: SiteNavLinksProps) => {
  const navClassName =
    variant === "desktop" ? "site-nav-links" : "site-mobile-links";
  const linkClassName =
    variant === "desktop" ? "site-nav-link" : "site-mobile-link";

  return (
    <nav className={navClassName}>
      {siteNavItems.map((item) => (
        <NavLink
          className={({ isActive }) =>
            joinClasses(linkClassName, isActive && "is-active")
          }
          key={item.to}
          to={item.to}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};
