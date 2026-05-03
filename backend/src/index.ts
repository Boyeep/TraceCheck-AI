import "dotenv/config";
import { createApp } from "./app";
import { bootstrapDatabase } from "./services/database-service";
import { buildIntegrationStatus } from "./services/integration-status-service";
import {
  getRuntimeConfig,
  validateRuntimeConfig,
} from "./services/runtime-config-service";

const port = Number(process.env.PORT ?? "8787");
const runtimeConfig = getRuntimeConfig();
const app = createApp();

if (
  runtimeConfig.authMode === "session" ||
  Boolean(runtimeConfig.databaseUrl) ||
  Boolean(process.env.TRACECHECK_DATABASE_DRIVER?.trim())
) {
  await bootstrapDatabase();
}

app.listen(port, () => {
  const diagnostics = validateRuntimeConfig(runtimeConfig);
  const status = buildIntegrationStatus();
  const modeLine =
    status.readiness.binaryOcr === "azure"
      ? `Azure Document Intelligence ready with model ${status.modelId}.`
      : "Fallback mode active. Configure Azure credentials to enable live OCR.";

  console.log(`${runtimeConfig.serviceName} listening on http://127.0.0.1:${port}`);
  console.log(modeLine);
  diagnostics.forEach((diagnostic) => {
    const line = `[tracecheck.config.${diagnostic.severity}] ${diagnostic.message}`;
    if (diagnostic.severity === "error") {
      console.error(line);
    } else {
      console.warn(line);
    }
  });

  if (
    runtimeConfig.strictStartupChecks &&
    diagnostics.some((diagnostic) => diagnostic.severity === "error")
  ) {
    throw new Error(
      "TraceCheck strict startup checks failed. Resolve configuration errors before continuing.",
    );
  }
});
