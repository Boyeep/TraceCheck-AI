export type AuthSessionUser = {
  userId: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: AuthSessionUser;
};

const authStorageKey = "tracecheck.auth.session";

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthSession>;
  return (
    typeof candidate.token === "string" &&
    typeof candidate.expiresAt === "string" &&
    typeof candidate.user?.userId === "string" &&
    typeof candidate.user?.name === "string" &&
    typeof candidate.user?.email === "string" &&
    Array.isArray(candidate.user?.roles) &&
    Array.isArray(candidate.user?.permissions)
  );
};

export const getStoredAuthSession = (): AuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(authStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const storeAuthSession = (session: AuthSession) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
};

export const clearStoredAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(authStorageKey);
};
