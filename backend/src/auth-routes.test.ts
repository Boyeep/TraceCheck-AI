import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { resetAuthState } from "./services/auth-service";
import { queryDatabase } from "./services/database-service";

type AuthSessionPayload = {
  expiresAt: string;
  token: string;
  user: {
    email: string;
    name: string;
    permissions: string[];
    roles: string[];
    userId: string;
  };
};

const withTemporaryEnv = async (
  entries: Record<string, string | undefined>,
  callback: () => Promise<void>,
) => {
  const previous = new Map<string, string | undefined>();
  Object.entries(entries).forEach(([key, value]) => {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  });

  try {
    await callback();
  } finally {
    previous.forEach((value, key) => {
      if (value === undefined) {
        delete process.env[key];
        return;
      }

      process.env[key] = value;
    });
  }
};

await withTemporaryEnv(
  {
    TRACECHECK_AUTH_MODE: "session",
    TRACECHECK_DATABASE_DRIVER: "pg-mem",
    TRACECHECK_FREEZE_WRITE_OPERATIONS: "false",
  },
  async () => {
    await resetAuthState();

    const app = createApp();
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");

    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      const deniedStatusResponse = await fetch(`${baseUrl}/api/integration/status`);
      assert.equal(deniedStatusResponse.status, 401);

      const signUpResponse = await fetch(`${baseUrl}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "QA Demo",
          email: "qa@example.com",
          password: "password123",
        }),
      });
      assert.equal(signUpResponse.status, 201);

      const signUpPayload = (await signUpResponse.json()) as AuthSessionPayload;
      assert.equal(signUpPayload.user.email, "qa@example.com");
      assert.equal(signUpPayload.user.roles[0], "qa-operator");
      assert.ok(signUpPayload.token);

      const storedSessionResult = await queryDatabase<{
        token_hash: string;
      }>(
        "SELECT token_hash FROM auth_sessions LIMIT 1",
      );
      assert.equal(storedSessionResult.rows.length, 1);
      assert.notEqual(storedSessionResult.rows[0].token_hash, signUpPayload.token);
      assert.equal(storedSessionResult.rows[0].token_hash.length, 64);

      const appliedMigrationsResult = await queryDatabase<{
        file_name: string;
      }>(
        "SELECT file_name FROM tracecheck_schema_migrations ORDER BY file_name",
      );
      assert.deepEqual(
        appliedMigrationsResult.rows.map((row) => row.file_name),
        ["001_auth_tables.sql"],
      );

      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${signUpPayload.token}`,
        },
      });
      assert.equal(sessionResponse.status, 200);

      const sessionPayload = (await sessionResponse.json()) as AuthSessionPayload;
      assert.equal(sessionPayload.user.userId, signUpPayload.user.userId);
      assert.ok(sessionPayload.user.permissions.includes("integration:read"));

      const allowedStatusResponse = await fetch(`${baseUrl}/api/integration/status`, {
        headers: {
          Authorization: `Bearer ${signUpPayload.token}`,
        },
      });
      assert.equal(allowedStatusResponse.status, 200);

      const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${signUpPayload.token}`,
        },
      });
      assert.equal(logoutResponse.status, 204);

      const expiredStatusResponse = await fetch(`${baseUrl}/api/integration/status`, {
        headers: {
          Authorization: `Bearer ${signUpPayload.token}`,
        },
      });
      assert.equal(expiredStatusResponse.status, 401);

      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "qa@example.com",
          password: "password123",
        }),
      });
      assert.equal(loginResponse.status, 200);

      const loginPayload = (await loginResponse.json()) as AuthSessionPayload;
      assert.equal(loginPayload.user.userId, signUpPayload.user.userId);
    } finally {
      await resetAuthState();
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  },
);

console.log("auth route tests passed (7 checks)");
