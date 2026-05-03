import type { AzureIntegrationStatus } from "../../../shared/types";
import { getRuntimeConfig } from "./runtime-config-service";

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

type RequestMetricContext = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type AlertContext = {
  severity: "warning" | "critical";
  category: string;
  message: string;
  details?: Record<string, unknown>;
};

const getAzureReadyCapabilities = (status: AzureIntegrationStatus) =>
  Object.entries(status.readiness)
    .filter(([, mode]) => mode === "azure")
    .map(([capability]) => capability);

const counters = new Map<string, number>();
const timers = new Map<string, {
  count: number;
  maxMs: number;
  totalMs: number;
}>();
const startedAt = new Date().toISOString();

const serializeError = (error: unknown) =>
  error instanceof Error
    ? {
        name: error.name,
        message: error.message,
      }
    : undefined;

const buildMetricKey = (
  metric: string,
  tags?: Record<string, string | number | boolean>,
) =>
  tags
    ? `${metric}:${Object.entries(tags)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}=${value}`)
        .join(",")}`
    : metric;

const dispatchAlert = async ({
  severity,
  category,
  message,
  details,
}: AlertContext) => {
  const { monitoringWebhookUrl, serviceName } = getRuntimeConfig();
  if (!monitoringWebhookUrl || !URL.canParse(monitoringWebhookUrl)) {
    return;
  }

  try {
    const response = await fetch(monitoringWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service: serviceName,
        severity,
        category,
        message,
        time: new Date().toISOString(),
        details,
      }),
    });

    if (!response.ok) {
      throw new Error(`Alert webhook returned ${response.status}`);
    }

    incrementCounter("alerts.dispatched", { severity, category });
  } catch (error) {
    incrementCounter("alerts.failed", { severity, category });
    const payload = JSON.stringify({
      severity,
      category,
      message,
      details,
      error: serializeError(error),
    });
    console.error(`[tracecheck.alert_error] ${payload}`);
  }
};

export const incrementCounter = (
  metric: string,
  tags?: Record<string, string | number | boolean>,
) => {
  const key = buildMetricKey(metric, tags);
  counters.set(key, (counters.get(key) ?? 0) + 1);
};

export const recordRequestMetric = ({
  method,
  path,
  statusCode,
  durationMs,
}: RequestMetricContext) => {
  incrementCounter("requests.total");
  incrementCounter("requests.by_status", { statusCode });
  incrementCounter("requests.by_route", { method, path });

  const timerKey = buildMetricKey("request.duration", { method, path });
  const existing = timers.get(timerKey) ?? {
    count: 0,
    maxMs: 0,
    totalMs: 0,
  };
  existing.count += 1;
  existing.maxMs = Math.max(existing.maxMs, durationMs);
  existing.totalMs += durationMs;
  timers.set(timerKey, existing);
};

export const getMonitoringSnapshot = () => ({
  service: getRuntimeConfig().serviceName,
  startedAt,
  counters: Object.fromEntries(counters),
  timers: Object.fromEntries(
    Array.from(timers.entries()).map(([key, timer]) => [
      key,
      {
        ...timer,
        avgMs: Number((timer.totalMs / timer.count).toFixed(2)),
      },
    ]),
  ),
});

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

  incrementCounter("integration.degraded", {
    operation,
    fallbackMode: status.mode,
  });
  void dispatchAlert({
    severity: "warning",
    category: "integration.degraded",
    message: `TraceCheck fell back during ${operation}.`,
    details: {
      requestId,
      method,
      path,
      readiness: status.readiness,
      reason: status.reason,
      azureReadyCapabilities,
      ...details,
    },
  });
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

  incrementCounter("requests.failed", {
    statusCode,
    path,
  });

  if (statusCode >= 500) {
    void dispatchAlert({
      severity: "critical",
      category: "request.failure",
      message,
      details: {
        requestId,
        method,
        path,
        statusCode,
        error: serializeError(error),
      },
    });
  }

  if (statusCode >= 500) {
    console.error(`[tracecheck.request_error] ${payload}`);
    return;
  }

  console.warn(`[tracecheck.request_error] ${payload}`);
};
