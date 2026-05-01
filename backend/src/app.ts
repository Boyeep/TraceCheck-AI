import express from "express";
import { registerAnalysisRoutes } from "./routes/analysis-routes";
import { registerDocumentRoutes } from "./routes/document-routes";
import { registerIntegrationRoutes } from "./routes/integration-routes";

export const createApp = () => {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use((_, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });

  registerIntegrationRoutes(app);
  registerDocumentRoutes(app);
  registerAnalysisRoutes(app);

  return app;
};
