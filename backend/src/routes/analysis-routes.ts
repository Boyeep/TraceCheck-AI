import type { Express } from "express";
import type {
  AnalyzeDocumentsResponse,
  TraceDocument,
} from "../../../shared/types";
import { buildAnalysis } from "../services/analysis-service";
import { buildIntegrationStatus } from "../services/integration-status-service";
import { logIntegrationDegradation } from "../services/observability-service";

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

    logIntegrationDegradation({
      requestId: String(response.getHeader("X-Request-Id") ?? "unknown"),
      method: request.method,
      path: request.path,
      operation: "analysis",
      status: payload.integrationStatus,
      details: {
        documentCount: documents.length,
        summarySource: analysis.summarySource ?? "rule-engine",
      },
    });

    response.json(payload);
  });
};
