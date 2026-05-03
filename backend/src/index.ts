import "dotenv/config";
import { createApp } from "./app";
import { buildIntegrationStatus } from "./services/integration-status-service";
import {
  getRuntimeConfig,
  validateRuntimeConfig,
} from "./services/runtime-config-service";

const port = Number(process.env.PORT ?? "8787");
const app = createApp();

app.listen(port, () => {
  const config = getRuntimeConfig();
  const diagnostics = validateRuntimeConfig(config);
  const status = buildIntegrationStatus();
  const modeLine =
    status.readiness.binaryOcr === "azure"
      ? `Azure Document Intelligence ready with model ${status.modelId}.`
      : "Fallback mode active. Configure Azure credentials to enable live OCR.";

  console.log(`${config.serviceName} listening on http://127.0.0.1:${port}`);
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
    config.strictStartupChecks &&
    diagnostics.some((diagnostic) => diagnostic.severity === "error")
  ) {
    throw new Error(
      "TraceCheck strict startup checks failed. Resolve configuration errors before continuing.",
    );
  }
});
