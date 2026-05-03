import { routePaths } from "./paths";

export type SiteNavItem = {
  to: string;
  label: string;
};

export const siteNavItems: SiteNavItem[] = [
  { to: routePaths.home, label: "Home" },
  { to: routePaths.features, label: "Features" },
  { to: routePaths.workspace, label: "Workspace" },
];

export const footerNavItems = siteNavItems.filter(
  (item) => item.to !== routePaths.home,
);
