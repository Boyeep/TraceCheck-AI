import type { Express } from "express";
import { getRecentAuditEvents } from "../services/audit-service";
import { getMonitoringSnapshot } from "../services/observability-service";
import { applyRateLimit } from "../services/rate-limit-service";
import {
  authenticateRequest,
  requirePermission,
} from "../services/security-service";

export const registerOpsRoutes = (app: Express) => {
  app.get(
    "/api/ops/metrics",
    authenticateRequest,
    requirePermission("ops:read"),
    applyRateLimit("ops"),
    (_request, response) => {
      response.json(getMonitoringSnapshot());
    },
  );

  app.get(
    "/api/ops/audit/recent",
    authenticateRequest,
    requirePermission("ops:audit:read"),
    applyRateLimit("ops"),
    (request, response) => {
      const limit = Number(request.query.limit ?? "50");
      response.json({
        events: getRecentAuditEvents(Number.isFinite(limit) ? limit : 50),
      });
    },
  );
};
