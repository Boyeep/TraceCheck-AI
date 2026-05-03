import { workspacePaths } from "../routes";

export const getSafeNextPath = (
  candidate: string | null | undefined,
  fallback = workspacePaths.upload,
) => {
  const nextPath = candidate?.trim();
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
};

export const buildAuthNextQuery = (nextPath: string) =>
  `?next=${encodeURIComponent(nextPath)}`;
