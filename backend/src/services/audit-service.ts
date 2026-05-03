import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getRuntimeConfig } from "./runtime-config-service";

export type AuditEvent = {
  timestamp: string;
  requestId: string;
  actorId: string;
  action: string;
  resource: string;
  outcome: "success" | "denied" | "failed";
  details?: Record<string, unknown>;
};

const recentAuditEvents: AuditEvent[] = [];

const rememberAuditEvent = (event: AuditEvent) => {
  recentAuditEvents.push(event);
  const { auditEventBufferSize } = getRuntimeConfig();
  if (recentAuditEvents.length > auditEventBufferSize) {
    recentAuditEvents.splice(0, recentAuditEvents.length - auditEventBufferSize);
  }
};

const persistAuditEvent = async (event: AuditEvent) => {
  const { auditLogPath } = getRuntimeConfig();
  if (!auditLogPath) {
    return;
  }

  const absolutePath = resolve(process.cwd(), auditLogPath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await appendFile(absolutePath, `${JSON.stringify(event)}\n`, "utf8");
};

export const recordAuditEvent = (event: AuditEvent) => {
  rememberAuditEvent(event);
  void persistAuditEvent(event).catch((error) => {
    const message =
      error instanceof Error ? error.message : "Unknown audit log write failure.";
    console.error(`[tracecheck.audit_error] ${JSON.stringify({
      requestId: event.requestId,
      actorId: event.actorId,
      action: event.action,
      resource: event.resource,
      message,
    })}`);
  });
};

export const getRecentAuditEvents = (limit = 50) =>
  recentAuditEvents.slice(-Math.max(1, limit)).reverse();
