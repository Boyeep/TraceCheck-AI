import { routePaths } from "./paths";

export type SiteNavItem = {
  to: string;
  label: string;
};

export type SiteActionLink = SiteNavItem & {
  tone: "light" | "strong";
};

export const siteNavItems: SiteNavItem[] = [
  { to: routePaths.home, label: "Home" },
  { to: routePaths.features, label: "Features" },
  { to: routePaths.workspace, label: "Workspace" },
];

export const footerNavItems = siteNavItems.filter(
  (item) => item.to !== routePaths.home,
);

export const siteActionLinks: SiteActionLink[] = [
  { to: routePaths.features, label: "Explore features", tone: "light" },
  { to: routePaths.workspace, label: "Open workspace", tone: "strong" },
];
