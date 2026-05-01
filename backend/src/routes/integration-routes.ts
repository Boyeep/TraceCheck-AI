import type { Express } from "express";
import { buildIntegrationStatus } from "../services/integration-status-service";

export const registerIntegrationRoutes = (app: Express) => {
  app.get("/api/integration/status", (_request, response) => {
    response.json(buildIntegrationStatus());
  });
};
