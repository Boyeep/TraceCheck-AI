import { defineConfig } from "@playwright/test";

const backendPort = 8787;
const frontendPort = 4173;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run start:backend",
      port: backendPort,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev:frontend:ci",
      port: frontendPort,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        ...process.env,
        VITE_TRACECHECK_API_BASE_URL: `http://127.0.0.1:${backendPort}`,
      },
    },
  ],
});
