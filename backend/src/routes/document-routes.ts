import { createRequire } from "node:module";
import type { Express } from "express";
import { extractDocumentFromUpload } from "../services/document-extraction-service";
import { ApiError } from "../services/api-error";
import { logIntegrationDegradation } from "../services/observability-service";
import { documentUpload } from "../services/upload-service";

const require = createRequire(import.meta.url);
const { isDocumentKind } = require("../../../shared/documents") as
  typeof import("../../../shared/documents");

export const registerDocumentRoutes = (app: Express) => {
  app.post(
    "/api/documents/extract",
    documentUpload.single("file"),
    async (request, response) => {
      const kindValue = request.body.kind;
      const kind =
        typeof kindValue === "string" && isDocumentKind(kindValue)
          ? kindValue
          : undefined;
      const file = request.file;

      if (!kind) {
        throw new ApiError(400, "A valid document kind is required.");
      }

      if (!file) {
        throw new ApiError(400, "A file upload is required.");
      }

      const result = await extractDocumentFromUpload(kind, file);
      logIntegrationDegradation({
        requestId: String(response.getHeader("X-Request-Id") ?? "unknown"),
        method: request.method,
        path: request.path,
        operation: "document.extract",
        status: result.integrationStatus,
        details: {
          documentKind: kind,
          fileName: file.originalname,
          sourceMode: result.document.sourceMode,
          processingSource: result.document.processingSource ?? "unknown",
        },
      });
      response.json(result);
    },
  );
};
