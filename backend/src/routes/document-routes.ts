import { createRequire } from "node:module";
import type { Express } from "express";
import { extractDocumentFromUpload } from "../services/document-extraction-service";
import { ApiError } from "../services/api-error";
import { recordAuditEvent } from "../services/audit-service";
import { logIntegrationDegradation } from "../services/observability-service";
import { applyRateLimit } from "../services/rate-limit-service";
import {
  authenticateRequest,
  getResponseActor,
  getResponseRequestId,
  requirePermission,
  requireWriteOperationsEnabled,
} from "../services/security-service";
import { documentUpload } from "../services/upload-service";

const require = createRequire(import.meta.url);
const { isDocumentKind } = require("../../../shared/documents") as
  typeof import("../../../shared/documents");

export const registerDocumentRoutes = (app: Express) => {
  app.post(
    "/api/documents/extract",
    authenticateRequest,
    requirePermission("document:extract"),
    applyRateLimit("upload"),
    requireWriteOperationsEnabled("document.extract"),
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
        requestId: getResponseRequestId(response),
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
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        requestId: getResponseRequestId(response),
        actorId: getResponseActor(response)?.actorId ?? "anonymous",
        action: "document.extract",
        resource: kind,
        outcome: "success",
        details: {
          fileName: result.document.displayName,
          sourceMode: result.document.sourceMode,
          processingSource: result.document.processingSource ?? "unknown",
          integrationMode: result.integrationStatus.mode,
        },
      });
      response.json(result);
    },
  );
};
