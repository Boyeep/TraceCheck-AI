import type { ActorRole } from "./runtime-config-service";
import { isActorRole } from "./runtime-config-service";
import { queryDatabase } from "./database-service";

type AuthUserRow = {
  created_at: string;
  email: string;
  id: string;
  name: string;
  password_hash: string;
  password_salt: string;
  roles: string;
};

type AuthSessionRow = {
  created_at: string;
  expires_at: string;
  id: string;
  revoked_at: string | null;
  token_hash: string;
  user_id: string;
};

type AuthSessionUserJoinRow = AuthUserRow & {
  session_created_at: string;
  session_expires_at: string;
  session_id: string;
  session_token_hash: string;
};

export type StoredUser = {
  createdAt: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  roles: ActorRole[];
  userId: string;
};

export type StoredSession = {
  createdAt: string;
  expiresAt: string;
  sessionId: string;
  tokenHash: string;
  userId: string;
};

export type StoredSessionWithUser = {
  session: StoredSession;
  user: StoredUser;
};

const serializeRoles = (roles: ActorRole[]) => roles.join(",");

const deserializeRoles = (rawRoles: string): ActorRole[] =>
  rawRoles
    .split(",")
    .map((role) => role.trim())
    .filter((role): role is ActorRole => isActorRole(role));

const mapUserRow = (row: AuthUserRow): StoredUser => ({
  createdAt: row.created_at,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  passwordSalt: row.password_salt,
  roles: deserializeRoles(row.roles),
  userId: row.id,
});

const mapSessionRow = (row: AuthSessionRow): StoredSession => ({
  createdAt: row.created_at,
  expiresAt: row.expires_at,
  sessionId: row.id,
  tokenHash: row.token_hash,
  userId: row.user_id,
});

export const findUserByEmail = async (email: string) => {
  const result = await queryDatabase<AuthUserRow>(
    `
      SELECT
        id,
        name,
        email,
        roles,
        password_hash,
        password_salt,
        created_at
      FROM auth_users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ? mapUserRow(result.rows[0]) : undefined;
};

export const createUser = async (user: StoredUser) => {
  await queryDatabase(
    `
      INSERT INTO auth_users (
        id,
        name,
        email,
        roles,
        password_hash,
        password_salt,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      user.userId,
      user.name,
      user.email,
      serializeRoles(user.roles),
      user.passwordHash,
      user.passwordSalt,
      user.createdAt,
    ],
  );

  return user;
};

export const createSession = async (session: StoredSession) => {
  await queryDatabase(
    `
      INSERT INTO auth_sessions (
        id,
        user_id,
        token_hash,
        created_at,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      session.sessionId,
      session.userId,
      session.tokenHash,
      session.createdAt,
      session.expiresAt,
    ],
  );

  return session;
};

export const findActiveSessionByTokenHash = async (tokenHash: string) => {
  const result = await queryDatabase<AuthSessionUserJoinRow>(
    `
      SELECT
        s.id AS session_id,
        s.token_hash AS session_token_hash,
        s.created_at AS session_created_at,
        s.expires_at AS session_expires_at,
        u.id,
        u.name,
        u.email,
        u.roles,
        u.password_hash,
        u.password_salt,
        u.created_at
      FROM auth_sessions s
      INNER JOIN auth_users u
        ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash],
  );

  const row = result.rows[0];
  if (!row) {
    return undefined;
  }

  return {
    session: {
      createdAt: row.session_created_at,
      expiresAt: row.session_expires_at,
      sessionId: row.session_id,
      tokenHash: row.session_token_hash,
      userId: row.id,
    },
    user: mapUserRow(row),
  } satisfies StoredSessionWithUser;
};

export const revokeSessionByTokenHash = async (tokenHash: string) => {
  await queryDatabase(
    `
      UPDATE auth_sessions
      SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
    `,
    [tokenHash],
  );
};
