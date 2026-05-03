import type { AzureIntegrationStatus } from "../../../shared/types";

type IntegrationDegradationContext = {
  requestId: string;
  method: string;
  path: string;
  operation: string;
  status: AzureIntegrationStatus;
  details?: Record<string, unknown>;
};

type RequestFailureContext = {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  message: string;
  error?: unknown;
};

const getAzureReadyCapabilities = (status: AzureIntegrationStatus) =>
  Object.entries(status.readiness)
    .filter(([, mode]) => mode === "azure")
    .map(([capability]) => capability);

const serializeError = (error: unknown) =>
  error instanceof Error
    ? {
        name: error.name,
        message: error.message,
      }
    : undefined;

export const logIntegrationDegradation = ({
  requestId,
  method,
  path,
  operation,
  status,
  details,
}: IntegrationDegradationContext) => {
  const azureReadyCapabilities = getAzureReadyCapabilities(status);
  if (status.mode !== "fallback" || !azureReadyCapabilities.length) {
    return;
  }

  console.warn(
    `[tracecheck.degraded] ${JSON.stringify({
      requestId,
      method,
      path,
      operation,
      mode: status.mode,
      readiness: status.readiness,
      azureReadyCapabilities,
      reason: status.reason,
      documentIntelligenceConfigured: status.documentIntelligenceConfigured,
      openAiConfigured: status.openAiConfigured,
      details,
    })}`,
  );
};

export const logRequestFailure = ({
  requestId,
  method,
  path,
  statusCode,
  message,
  error,
}: RequestFailureContext) => {
  const payload = JSON.stringify({
    requestId,
    method,
    path,
    statusCode,
    message,
    error: serializeError(error),
  });

  if (statusCode >= 500) {
    console.error(`[tracecheck.request_error] ${payload}`);
    return;
  }

  console.warn(`[tracecheck.request_error] ${payload}`);
};
