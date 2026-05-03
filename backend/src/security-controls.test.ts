import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { resetRateLimitState } from "./services/rate-limit-service";

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

const withServer = async (callback: (baseUrl: string) => Promise<void>) => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await callback(baseUrl);
  } finally {
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
};

await withTemporaryEnv(
  {
    TRACECHECK_AUTH_MODE: "api-key",
    TRACECHECK_API_TOKENS: "ops-admin:test-token:ops-admin",
  },
  async () => {
    await withServer(async (baseUrl) => {
      const deniedResponse = await fetch(`${baseUrl}/api/health/ready`);
      assert.equal(deniedResponse.status, 401);

      const allowedResponse = await fetch(`${baseUrl}/api/health/ready`, {
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      assert.equal(allowedResponse.status, 200);

      const metricsResponse = await fetch(`${baseUrl}/api/ops/metrics`, {
        headers: {
          Authorization: "Bearer test-token",
        },
      });
      assert.equal(metricsResponse.status, 200);
    });
  },
);

await withTemporaryEnv(
  {
    TRACECHECK_AUTH_MODE: "disabled",
    TRACECHECK_RATE_LIMIT_STATUS_MAX_REQUESTS: "1",
  },
  async () => {
    resetRateLimitState();
    await withServer(async (baseUrl) => {
      const firstResponse = await fetch(`${baseUrl}/api/integration/status`);
      assert.equal(firstResponse.status, 200);

      const secondResponse = await fetch(`${baseUrl}/api/integration/status`);
      assert.equal(secondResponse.status, 429);
      assert.ok(secondResponse.headers.get("retry-after"));
    });
  },
);

await withTemporaryEnv(
  {
    TRACECHECK_FREEZE_WRITE_OPERATIONS: "true",
  },
  async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documents: [] }),
      });

      assert.equal(response.status, 503);
      const payload = (await response.json()) as {
        message: string;
      };
      assert.equal(
        payload.message,
        "Write operations are temporarily frozen by operational policy.",
      );
    });
  },
);

console.log("security control tests passed (3 scenarios)");
