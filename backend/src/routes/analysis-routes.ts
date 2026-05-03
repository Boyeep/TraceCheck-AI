import type { Express } from "express";
import type {
  AnalyzeDocumentsResponse,
  TraceDocument,
} from "../../../shared/types";
import { buildAnalysis } from "../services/analysis-service";
import { recordAuditEvent } from "../services/audit-service";
import { buildIntegrationStatus } from "../services/integration-status-service";
import { logIntegrationDegradation } from "../services/observability-service";
import { applyRateLimit } from "../services/rate-limit-service";
import {
  authenticateRequest,
  getResponseActor,
  getResponseRequestId,
  requirePermission,
  requireWriteOperationsEnabled,
} from "../services/security-service";

export const registerAnalysisRoutes = (app: Express) => {
  app.post(
    "/api/analysis",
    authenticateRequest,
    requirePermission("analysis:run"),
    applyRateLimit("analysis"),
    requireWriteOperationsEnabled("analysis"),
    async (request, response) => {
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
      requestId: getResponseRequestId(response),
      method: request.method,
      path: request.path,
      operation: "analysis",
      status: payload.integrationStatus,
      details: {
        documentCount: documents.length,
        summarySource: analysis.summarySource ?? "rule-engine",
      },
    });
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      requestId: getResponseRequestId(response),
      actorId: getResponseActor(response)?.actorId ?? "anonymous",
      action: "analysis.run",
      resource: "trace-documents",
      outcome: "success",
      details: {
        documentCount: documents.length,
        mode: payload.integrationStatus.mode,
        summarySource: analysis.summarySource ?? "rule-engine",
      },
    });

    response.json(payload);
    },
  );
};
