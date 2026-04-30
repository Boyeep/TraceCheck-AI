import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { app } from "../app";
import { buildIntegrationStatus } from "../lib/integration";
import { analyzeDocuments, createEmptyAnalysis } from "../lib/tracecheck";
import type { AnalyzeDocumentsResponse, TraceDocument } from "../lib/types";

const jsonResponse = (body: unknown, status = 200): HttpResponseInit => ({
  status,
  jsonBody: body,
  headers: {
    "Cache-Control": "no-store",
  },
});

export async function analyzeDocumentsHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const payload = (await request.json()) as { documents?: TraceDocument[] };
  const documents = Array.isArray(payload.documents) ? payload.documents : [];

  const responseBody: AnalyzeDocumentsResponse = {
    analysis: documents.length ? analyzeDocuments(documents) : createEmptyAnalysis(),
    integrationStatus: buildIntegrationStatus(),
  };

  return jsonResponse(responseBody);
}

app.http("analyzeDocuments", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "analysis",
  handler: analyzeDocumentsHandler,
});
