export const routePaths = {
  home: "/",
  features: "/features",
  login: "/login",
  signup: "/signup",
  workspace: "/workspace",
} as const;

export const featureRouteParam = "featureSlug";
export const featureRoutePath = `${routePaths.features}/:${featureRouteParam}`;

export const buildFeaturePath = (featureSlug: string) =>
  `${routePaths.features}/${featureSlug}`;

export const workspaceRouteSegments = {
  upload: "upload",
  review: "review",
  validate: "validate",
  decision: "decision",
} as const;

export const workspacePaths = {
  root: routePaths.workspace,
  upload: `${routePaths.workspace}/${workspaceRouteSegments.upload}`,
  review: `${routePaths.workspace}/${workspaceRouteSegments.review}`,
  validate: `${routePaths.workspace}/${workspaceRouteSegments.validate}`,
  decision: `${routePaths.workspace}/${workspaceRouteSegments.decision}`,
} as const;
