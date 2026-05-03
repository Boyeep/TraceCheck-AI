import type { Express } from "express";
import { buildIntegrationStatus } from "../services/integration-status-service";
import {
  authenticateRequest,
  requirePermission,
} from "../services/security-service";
import { applyRateLimit } from "../services/rate-limit-service";

export const registerIntegrationRoutes = (app: Express) => {
  app.get(
    "/api/integration/status",
    authenticateRequest,
    requirePermission("integration:read"),
    applyRateLimit("status"),
    (_request, response) => {
    response.json(buildIntegrationStatus());
    },
  );
};
