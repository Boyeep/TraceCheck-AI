import "dotenv/config";
import { createApp } from "./app";
import { buildIntegrationStatus } from "./services/integration-status-service";

const port = Number(process.env.PORT ?? "8787");
const app = createApp();

app.listen(port, () => {
  const status = buildIntegrationStatus();
  const modeLine =
    status.mode === "azure"
      ? `Azure Document Intelligence active with model ${status.modelId}.`
      : "Fallback mode active. Configure Azure credentials to enable live OCR.";

  console.log(`TraceCheck API listening on http://127.0.0.1:${port}`);
  console.log(modeLine);
});
