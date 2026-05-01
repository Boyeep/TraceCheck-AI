import type { Express } from "express";
import { isDocumentKind } from "../../../shared/documents";
import { extractDocumentFromUpload } from "../services/document-extraction-service";
import { buildIntegrationStatus } from "../services/integration-status-service";
import { documentUpload } from "../services/upload-service";

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
        response.status(400).json({
          message: "A valid document kind is required.",
          integrationStatus: buildIntegrationStatus(),
        });
        return;
      }

      if (!file) {
        response.status(400).json({
          message: "A file upload is required.",
          integrationStatus: buildIntegrationStatus(),
        });
        return;
      }

      const result = await extractDocumentFromUpload(kind, file);
      response.json(result);
    },
  );
};
