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
    const analysis = await buildAnalysis(documents);

    const payload: AnalyzeDocumentsResponse = {
      analysis,
      integrationStatus: buildIntegrationStatus({
        mode: analysis.summarySource === "azure-openai" ? "azure" : "fallback",
      }),
    };

    response.json(payload);
  });
};
