import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { createApp } from "./app";
import { buildIntegrationStatus } from "./services/integration-status-service";
import type {
  AnalyzeDocumentsResponse,
  AzureIntegrationStatus,
  ExtractDocumentResponse,
} from "../../shared/types";

const requestIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const oversizedUploadBytes = 10 * 1024 * 1024 + 1;

const toJsonComparable = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

const assertCommonHeaders = (response: Response) => {
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("x-request-id") ?? "", requestIdPattern);
};

const app = createApp();
const server = app.listen(0, "127.0.0.1");

await once(server, "listening");

const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

try {
  const integrationStatusResponse = await fetch(`${baseUrl}/api/integration/status`);
  assert.equal(integrationStatusResponse.status, 200);
  assertCommonHeaders(integrationStatusResponse);

  const integrationStatusPayload =
    (await integrationStatusResponse.json()) as AzureIntegrationStatus;
  assert.deepEqual(
    integrationStatusPayload,
    toJsonComparable(buildIntegrationStatus()),
  );

  const analysisResponse = await fetch(`${baseUrl}/api/analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documents: [] }),
  });
  assert.equal(analysisResponse.status, 200);
  assertCommonHeaders(analysisResponse);

  const analysisPayload =
    (await analysisResponse.json()) as AnalyzeDocumentsResponse;
  assert.equal(analysisPayload.integrationStatus.mode, "fallback");
  assert.equal(analysisPayload.analysis.recommendation, "manual-review");
  assert.equal(analysisPayload.analysis.confidenceScore, 0);

  const uploadForm = new FormData();
  uploadForm.append("kind", "deliveryNote");
  uploadForm.append(
    "file",
    new Blob(
      [
        "Material Name: Lactose Monohydrate\nSupplier: Acme Pharma\nBatch Number: BATCH-001\nExpiry Date: 2027-05-01",
      ],
      { type: "text/plain" },
    ),
    "delivery-note.txt",
  );

  const extractResponse = await fetch(`${baseUrl}/api/documents/extract`, {
    method: "POST",
    body: uploadForm,
  });
  assert.equal(extractResponse.status, 200);
  assertCommonHeaders(extractResponse);

  const extractPayload =
    (await extractResponse.json()) as ExtractDocumentResponse;
  assert.equal(extractPayload.document.kind, "deliveryNote");
  assert.equal(extractPayload.document.displayName, "delivery-note.txt");
  assert.equal(extractPayload.document.sourceMode, "uploaded-text");
  assert.equal(extractPayload.document.contentType, "text/plain");
  assert.equal(
    extractPayload.integrationStatus.mode,
    extractPayload.document.processingSource === "azure-openai-extraction"
      ? "azure"
      : "fallback",
  );
  assert.ok(extractPayload.document.notes.length >= 1);

  const oversizedUploadForm = new FormData();
  oversizedUploadForm.append("kind", "coa");
  oversizedUploadForm.append(
    "file",
    new Blob([new Uint8Array(oversizedUploadBytes)], {
      type: "application/pdf",
    }),
    "oversized.pdf",
  );

  const oversizedUploadResponse = await fetch(`${baseUrl}/api/documents/extract`, {
    method: "POST",
    body: oversizedUploadForm,
  });
  assert.equal(oversizedUploadResponse.status, 413);
  assertCommonHeaders(oversizedUploadResponse);

  const oversizedUploadPayload = (await oversizedUploadResponse.json()) as {
    message: string;
    integrationStatus: AzureIntegrationStatus;
  };
  assert.equal(
    oversizedUploadPayload.message,
    "Uploaded file exceeds the 10 MB limit.",
  );
  assert.equal(oversizedUploadPayload.integrationStatus.mode, "fallback");
  assert.equal(
    oversizedUploadPayload.integrationStatus.reason,
    "Uploaded file exceeds the 10 MB limit.",
  );
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

console.log("api route smoke tests passed (4 cases)");
