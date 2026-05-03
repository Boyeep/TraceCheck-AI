import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { ApiError } from "./api-error";
import {
  createSession as persistSession,
  createUser as persistUser,
  findActiveSessionByTokenHash,
  findUserByEmail,
  revokeSessionByTokenHash,
  type StoredUser,
} from "./auth-repository";
import {
  bootstrapDatabase,
  resetDatabaseStateForTests,
} from "./database-service";
import {
  getRolePermissions,
  type ActorRole,
} from "./runtime-config-service";

const scrypt = promisify(scryptCallback);
const sessionTtlMs = 1000 * 60 * 60 * 24 * 7;
const minimumPasswordLength = 8;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthSessionUser = {
  userId: string;
  name: string;
  email: string;
  roles: ActorRole[];
  permissions: ReturnType<typeof getRolePermissions>;
};

export type AuthSessionPayload = {
  token: string;
  expiresAt: string;
  user: AuthSessionUser;
};

type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sanitizeUser = (user: StoredUser): AuthSessionUser => ({
  userId: user.userId,
  name: user.name,
  email: user.email,
  roles: user.roles,
  permissions: getRolePermissions(user.roles),
});

const requireNonEmpty = (value: string, fieldLabel: string) => {
  if (!value.trim()) {
    throw new ApiError(400, `${fieldLabel} is required.`);
  }
};

const validateEmail = (email: string) => {
  requireNonEmpty(email, "Email");
  if (!emailPattern.test(email)) {
    throw new ApiError(400, "Enter a valid email address.");
  }
};

const validatePassword = (password: string) => {
  requireNonEmpty(password, "Password");
  if (password.length < minimumPasswordLength) {
    throw new ApiError(
      400,
      `Password must be at least ${minimumPasswordLength} characters long.`,
    );
  }
};

const createPasswordHash = async (password: string, salt: string) => {
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return derivedKey.toString("hex");
};

const createSessionToken = () =>
  `${randomUUID()}-${randomBytes(24).toString("hex")}`;

const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const buildSessionPayload = (
  user: StoredUser,
  session: {
    expiresAt: string;
    token: string;
  },
): AuthSessionPayload => ({
  token: session.token,
  expiresAt: session.expiresAt,
  user: sanitizeUser(user),
});

const createSession = async (user: StoredUser): Promise<AuthSessionPayload> => {
  await bootstrapDatabase();
  const now = Date.now();
  const token = createSessionToken();
  const session = {
    sessionId: randomUUID(),
    tokenHash: hashSessionToken(token),
    userId: user.userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + sessionTtlMs).toISOString(),
  };

  await persistSession(session);
  return buildSessionPayload(user, {
    token,
    expiresAt: session.expiresAt,
  });
};

export const registerUser = async ({
  name,
  email,
  password,
}: SignUpInput): Promise<AuthSessionPayload> => {
  requireNonEmpty(name, "Full name");
  validateEmail(email);
  validatePassword(password);
  await bootstrapDatabase();

  const normalizedEmail = normalizeEmail(email);
  if (await findUserByEmail(normalizedEmail)) {
    throw new ApiError(409, "An account already exists for that email address.");
  }

  const user: StoredUser = {
    userId: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    roles: ["qa-operator"],
    passwordSalt: randomBytes(16).toString("hex"),
    passwordHash: "",
    createdAt: new Date().toISOString(),
  };
  user.passwordHash = await createPasswordHash(password, user.passwordSalt);

  await persistUser(user).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ApiError(
        409,
        "An account already exists for that email address.",
      );
    }

    throw error;
  });

  return await createSession(user);
};

export const authenticateUser = async ({
  email,
  password,
}: LoginInput): Promise<AuthSessionPayload> => {
  validateEmail(email);
  requireNonEmpty(password, "Password");
  await bootstrapDatabase();

  const user = await findUserByEmail(normalizeEmail(email));
  if (!user) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  const expectedHash = Buffer.from(user.passwordHash, "hex");
  const actualHash = Buffer.from(
    await createPasswordHash(password, user.passwordSalt),
    "hex",
  );
  if (
    expectedHash.length !== actualHash.length ||
    !timingSafeEqual(expectedHash, actualHash)
  ) {
    throw new ApiError(401, "Email or password is incorrect.");
  }

  return await createSession(user);
};

export const getAuthSession = async (token: string) => {
  await bootstrapDatabase();
  const session = await findActiveSessionByTokenHash(hashSessionToken(token));
  if (!session) {
    return undefined;
  }

  return buildSessionPayload(session.user, {
    token,
    expiresAt: session.session.expiresAt,
  });
};

export const buildSessionActor = async (token: string) => {
  const session = await getAuthSession(token);
  if (!session) {
    return undefined;
  }

  return {
    actorId: session.user.userId,
    permissions: session.user.permissions,
    roles: session.user.roles,
    authMode: "session" as const,
    authSource: "bearer" as const,
  };
};

export const revokeAuthSession = async (token: string) => {
  await bootstrapDatabase();
  await revokeSessionByTokenHash(hashSessionToken(token));
};

export const resetAuthState = async () => {
  await resetDatabaseStateForTests();
};
