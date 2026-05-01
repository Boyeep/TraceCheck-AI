import type { Express } from "express";
import type {
  AnalyzeDocumentsResponse,
  TraceDocument,
} from "../../../shared/types";
import { buildAnalysis } from "../services/analysis-service";
import { buildIntegrationStatus } from "../services/integration-status-service";

export const registerAnalysisRoutes = (app: Express) => {
  app.post("/api/analysis", async (request, response) => {
    const documents = Array.isArray(request.body?.documents)
      ? (request.body.documents as TraceDocument[])
      : [];

    const payload: AnalyzeDocumentsResponse = {
      analysis: await buildAnalysis(documents),
      integrationStatus: buildIntegrationStatus(),
    };

    response.json(payload);
  });
};
