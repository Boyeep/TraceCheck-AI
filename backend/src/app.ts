import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import type { ErrorRequestHandler } from "express";
import { registerAnalysisRoutes } from "./routes/analysis-routes";
import { registerDocumentRoutes } from "./routes/document-routes";
import { registerIntegrationRoutes } from "./routes/integration-routes";
import { ApiError } from "./services/api-error";
import { buildIntegrationStatus } from "./services/integration-status-service";
import { logRequestFailure } from "./services/observability-service";

const invalidJsonBodyMessage = "Request body is not valid JSON.";
const oversizedUploadMessage = "Uploaded file exceeds the 10 MB limit.";
const unexpectedServerErrorMessage =
  "TraceCheck API encountered an unexpected error.";

const isJsonParseError = (error: unknown): error is SyntaxError & { status: number } =>
  error instanceof SyntaxError &&
  typeof (error as unknown as { status?: unknown }).status === "number" &&
  (error as unknown as { status: number }).status === 400;

const mapErrorToResponse = (error: unknown) => {
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  if (error instanceof multer.MulterError) {
    return {
      statusCode: error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? oversizedUploadMessage
          : "Upload request could not be processed.",
    };
  }

  if (isJsonParseError(error)) {
    return {
      statusCode: 400,
      message: invalidJsonBodyMessage,
    };
  }

  return {
    statusCode: 500,
    message: unexpectedServerErrorMessage,
  };
};

export const createApp = () => {
  const app = express();

  app.use((_request, response, next) => {
    const requestId = crypto.randomUUID();
    response.setHeader("X-Request-Id", requestId);
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "1mb" }));

  registerIntegrationRoutes(app);
  registerDocumentRoutes(app);
  registerAnalysisRoutes(app);

  const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const { statusCode, message } = mapErrorToResponse(error);
    const requestId = String(response.getHeader("X-Request-Id") ?? "unknown");
    logRequestFailure({
      requestId,
      method: request.method,
      path: request.path,
      statusCode,
      message,
      error,
    });

    response.status(statusCode).json({
      message,
      integrationStatus: buildIntegrationStatus({
        mode: "fallback",
        reason: message,
      }),
    });
  };

  app.use(errorHandler);

  return app;
};
