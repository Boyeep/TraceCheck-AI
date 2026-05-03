import type { Express } from "express";
import {
  buildLivenessPayload,
  buildReadinessPayload,
} from "../services/health-service";
import { applyRateLimit } from "../services/rate-limit-service";
import {
  authenticateRequest,
  requirePermission,
} from "../services/security-service";

export const registerHealthRoutes = (app: Express) => {
  app.get("/api/health/live", applyRateLimit("health"), (_request, response) => {
    response.json(buildLivenessPayload());
  });

  app.get(
    "/api/health/ready",
    authenticateRequest,
    requirePermission("health:read"),
    applyRateLimit("health"),
    (_request, response) => {
      const payload = buildReadinessPayload();
      response.status(payload.status === "ready" ? 200 : 503).json(payload);
    },
  );
};
