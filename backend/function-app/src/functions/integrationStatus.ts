import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { app } from "../app";
import { buildIntegrationStatus } from "../lib/integration";

const jsonResponse = (body: unknown, status = 200): HttpResponseInit => ({
  status,
  jsonBody: body,
  headers: {
    "Cache-Control": "no-store",
  },
});

export async function integrationStatus(
  _request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  return jsonResponse(buildIntegrationStatus());
}

app.http("integrationStatus", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "integration/status",
  handler: integrationStatus,
});
