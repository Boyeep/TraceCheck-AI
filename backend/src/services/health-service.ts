import { buildIntegrationStatus } from "./integration-status-service";
import {
  getRuntimeConfig,
  validateRuntimeConfig,
} from "./runtime-config-service";

type HealthStatus = "live" | "ready" | "degraded";

export const buildLivenessPayload = () => {
  const config = getRuntimeConfig();

  return {
    status: "live" as HealthStatus,
    service: config.serviceName,
    time: new Date().toISOString(),
  };
};

export const buildReadinessPayload = () => {
  const config = getRuntimeConfig();
  const diagnostics = validateRuntimeConfig(config);
  const integrationStatus = buildIntegrationStatus();
  const hasErrors = diagnostics.some((diagnostic) => diagnostic.severity === "error");

  return {
    status: (hasErrors ? "degraded" : "ready") as HealthStatus,
    service: config.serviceName,
    time: new Date().toISOString(),
    checks: {
      configuration: {
        ok: !hasErrors,
        diagnostics,
      },
      auth: {
        mode: config.authMode,
        configuredActors: config.authTokens.length,
      },
      database: {
        driver: config.databaseDriver,
        configured: Boolean(config.databaseUrl) || config.databaseDriver === "pg-mem",
        autoMigrate: config.databaseAutoMigrate,
        ssl: config.databaseSsl,
      },
      uploads: {
        maxFileSizeMb: config.maxUploadFileSizeMb,
        allowedMimeTypes: config.allowedUploadMimeTypes,
        allowedExtensions: config.allowedUploadExtensions,
      },
      monitoring: {
        alertWebhookConfigured: Boolean(config.monitoringWebhookUrl),
        auditLogConfigured: Boolean(config.auditLogPath),
      },
      operations: {
        freezeWriteOperations: config.freezeWriteOperations,
      },
      integrations: integrationStatus,
    },
  };
};
