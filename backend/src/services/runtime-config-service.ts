export type Permission =
  | "integration:read"
  | "document:extract"
  | "analysis:run"
  | "health:read"
  | "ops:read"
  | "ops:audit:read";

export type ActorRole =
  | "qa-operator"
  | "qa-supervisor"
  | "ops-admin"
  | "auditor";

export type ConfigDiagnostic = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

export type AuthMode = "disabled" | "api-key" | "session";
export type DatabaseDriver = "postgres" | "pg-mem";

export type AuthTokenConfig = {
  actorId: string;
  token: string;
  roles: ActorRole[];
  permissions: Permission[];
};

export type RateLimitBucketName =
  | "auth"
  | "status"
  | "analysis"
  | "upload"
  | "ops"
  | "health";

export type RateLimitBucketConfig = {
  maxRequests: number;
  windowMs: number;
};

export type RuntimeConfig = {
  serviceName: string;
  nodeEnv: string;
  authMode: AuthMode;
  authTokens: AuthTokenConfig[];
  databaseDriver: DatabaseDriver;
  databaseUrl?: string;
  databaseSsl: boolean;
  databaseAutoMigrate: boolean;
  freezeWriteOperations: boolean;
  strictStartupChecks: boolean;
  monitoringWebhookUrl?: string;
  auditLogPath?: string;
  auditEventBufferSize: number;
  maxUploadFileSizeBytes: number;
  maxUploadFileSizeMb: number;
  allowedUploadMimeTypes: string[];
  allowedUploadExtensions: string[];
  rateLimits: Record<RateLimitBucketName, RateLimitBucketConfig>;
};

const rolePermissionMap: Record<ActorRole, Permission[]> = {
  "qa-operator": [
    "integration:read",
    "document:extract",
    "analysis:run",
    "health:read",
  ],
  "qa-supervisor": [
    "integration:read",
    "document:extract",
    "analysis:run",
    "health:read",
    "ops:audit:read",
  ],
  "ops-admin": [
    "integration:read",
    "document:extract",
    "analysis:run",
    "health:read",
    "ops:read",
    "ops:audit:read",
  ],
  auditor: ["integration:read", "health:read", "ops:audit:read"],
};

const defaultAllowedUploadMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "text/csv",
];

const defaultAllowedUploadExtensions = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".txt",
  ".csv",
];

const unique = <T>(values: T[]) => [...new Set(values)];
const actorRoles = [
  "qa-operator",
  "qa-supervisor",
  "ops-admin",
  "auditor",
] as const;

const parseBoolean = (value: string | undefined, fallback: boolean) =>
  value === undefined ? fallback : value.trim().toLowerCase() === "true";

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  const parsed = Number(value ?? "");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseList = (value: string | undefined, fallback: string[]) =>
  unique(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  ).length
    ? unique(
        (value ?? "")
          .split(",")
          .map((entry) => entry.trim().toLowerCase())
          .filter(Boolean),
      )
    : fallback;

const normalizeAuthMode = (value: string | undefined): AuthMode =>
  value?.trim().toLowerCase() === "api-key"
    ? "api-key"
    : value?.trim().toLowerCase() === "session"
      ? "session"
      : "disabled";

const normalizeDatabaseDriver = ({
  explicitValue,
  nodeEnv,
  databaseUrl,
}: {
  explicitValue: string | undefined;
  nodeEnv: string;
  databaseUrl?: string;
}): DatabaseDriver =>
  explicitValue?.trim().toLowerCase() === "pg-mem"
    ? "pg-mem"
    : explicitValue?.trim().toLowerCase() === "postgres"
      ? "postgres"
      : databaseUrl
        ? "postgres"
        : nodeEnv === "production"
          ? "postgres"
          : "pg-mem";

export const isActorRole = (value: string): value is ActorRole =>
  (actorRoles as readonly string[]).includes(value);

const parseRoles = (value: string) =>
  unique(
    value
      .split("|")
      .map((entry) => entry.trim())
      .filter((entry): entry is ActorRole => isActorRole(entry)),
  );

const parseAuthTokens = (rawValue: string | undefined): AuthTokenConfig[] =>
  (rawValue ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const [actorId, token, rolesRaw] = entry.split(":");
      if (!actorId || !token || !rolesRaw) {
        return [];
      }

      const roles = parseRoles(rolesRaw);
      if (!roles.length) {
        return [];
      }

      return [{
        actorId: actorId.trim(),
        token: token.trim(),
        roles,
        permissions: unique(roles.flatMap((role) => rolePermissionMap[role])),
      }];
    });

const parseWebhookUrl = (value: string | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
};

export const getAllPermissions = (): Permission[] =>
  unique(Object.values(rolePermissionMap).flat());

export const getRuntimeConfig = (): RuntimeConfig => {
  const nodeEnv = process.env.NODE_ENV?.trim() || "development";
  const databaseUrl =
    process.env.TRACECHECK_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    undefined;
  const maxUploadFileSizeMb = parsePositiveInteger(
    process.env.TRACECHECK_MAX_FILE_SIZE_MB,
    10,
  );
  const windowMs = parsePositiveInteger(
    process.env.TRACECHECK_RATE_LIMIT_WINDOW_MS,
    60_000,
  );

  return {
    serviceName: process.env.TRACECHECK_SERVICE_NAME?.trim() || "tracecheck-backend",
    nodeEnv,
    authMode: normalizeAuthMode(process.env.TRACECHECK_AUTH_MODE),
    authTokens: parseAuthTokens(process.env.TRACECHECK_API_TOKENS),
    databaseDriver: normalizeDatabaseDriver({
      explicitValue: process.env.TRACECHECK_DATABASE_DRIVER,
      nodeEnv,
      databaseUrl,
    }),
    databaseUrl,
    databaseSsl: parseBoolean(process.env.TRACECHECK_DATABASE_SSL, false),
    databaseAutoMigrate: parseBoolean(
      process.env.TRACECHECK_DATABASE_AUTO_MIGRATE,
      true,
    ),
    freezeWriteOperations: parseBoolean(
      process.env.TRACECHECK_FREEZE_WRITE_OPERATIONS,
      false,
    ),
    strictStartupChecks: parseBoolean(
      process.env.TRACECHECK_STRICT_STARTUP_CHECKS,
      false,
    ),
    monitoringWebhookUrl: parseWebhookUrl(
      process.env.TRACECHECK_ALERT_WEBHOOK_URL,
    ),
    auditLogPath: process.env.TRACECHECK_AUDIT_LOG_PATH?.trim() || undefined,
    auditEventBufferSize: parsePositiveInteger(
      process.env.TRACECHECK_AUDIT_EVENT_BUFFER_SIZE,
      200,
    ),
    maxUploadFileSizeBytes: maxUploadFileSizeMb * 1024 * 1024,
    maxUploadFileSizeMb,
    allowedUploadMimeTypes: parseList(
      process.env.TRACECHECK_ALLOWED_UPLOAD_MIME_TYPES,
      defaultAllowedUploadMimeTypes,
    ),
    allowedUploadExtensions: parseList(
      process.env.TRACECHECK_ALLOWED_UPLOAD_EXTENSIONS,
      defaultAllowedUploadExtensions,
    ),
    rateLimits: {
      auth: {
        maxRequests: parsePositiveInteger(
          process.env.TRACECHECK_RATE_LIMIT_AUTH_MAX_REQUESTS,
          20,
        ),
        windowMs,
      },
      status: {
        maxRequests: parsePositiveInteger(
          process.env.TRACECHECK_RATE_LIMIT_STATUS_MAX_REQUESTS,
          120,
        ),
        windowMs,
      },
      analysis: {
        maxRequests: parsePositiveInteger(
          process.env.TRACECHECK_RATE_LIMIT_ANALYSIS_MAX_REQUESTS,
          60,
        ),
        windowMs,
      },
      upload: {
        maxRequests: parsePositiveInteger(
          process.env.TRACECHECK_RATE_LIMIT_UPLOAD_MAX_REQUESTS,
          20,
        ),
        windowMs,
      },
      ops: {
        maxRequests: parsePositiveInteger(
          process.env.TRACECHECK_RATE_LIMIT_OPS_MAX_REQUESTS,
          30,
        ),
        windowMs,
      },
      health: {
        maxRequests: parsePositiveInteger(
          process.env.TRACECHECK_RATE_LIMIT_HEALTH_MAX_REQUESTS,
          120,
        ),
        windowMs,
      },
    },
  };
};

export const validateRuntimeConfig = (
  config = getRuntimeConfig(),
): ConfigDiagnostic[] => {
  const diagnostics: ConfigDiagnostic[] = [];

  if (config.authMode === "api-key" && !config.authTokens.length) {
    diagnostics.push({
      code: "auth.tokens_missing",
      severity: "error",
      message:
        "TRACECHECK_AUTH_MODE is set to api-key but TRACECHECK_API_TOKENS is empty or invalid.",
    });
  }

  if (
    config.monitoringWebhookUrl &&
    !URL.canParse(config.monitoringWebhookUrl)
  ) {
    diagnostics.push({
      code: "monitoring.webhook_invalid",
      severity: "error",
      message:
        "TRACECHECK_ALERT_WEBHOOK_URL must be a valid absolute URL when configured.",
    });
  }

  if (
    config.authMode === "session" &&
    config.databaseDriver === "postgres" &&
    !config.databaseUrl
  ) {
    diagnostics.push({
      code: "database.url_missing",
      severity: "error",
      message:
        "Session auth requires TRACECHECK_DATABASE_URL (or DATABASE_URL) when TRACECHECK_DATABASE_DRIVER=postgres.",
    });
  }

  if (
    config.authMode === "session" &&
    config.databaseDriver === "pg-mem"
  ) {
    diagnostics.push({
      code: "database.pg_mem_ephemeral",
      severity: config.nodeEnv === "production" ? "error" : "warning",
      message:
        "Session auth is using the pg-mem in-memory database. Accounts and sessions will be lost on restart.",
    });
  }

  if (
    config.nodeEnv === "production" &&
    config.authMode === "disabled"
  ) {
    diagnostics.push({
      code: "auth.disabled_in_production",
      severity: "warning",
      message:
        "Authentication is disabled while NODE_ENV=production. Enable TRACECHECK_AUTH_MODE=session or api-key before a real deployment.",
    });
  }

  if (
    config.nodeEnv === "production" &&
    !config.monitoringWebhookUrl
  ) {
    diagnostics.push({
      code: "monitoring.webhook_missing",
      severity: "warning",
      message:
        "No alert webhook is configured for production. Add TRACECHECK_ALERT_WEBHOOK_URL to forward critical backend events.",
    });
  }

  if (
    config.nodeEnv === "production" &&
    !config.auditLogPath
  ) {
    diagnostics.push({
      code: "audit.path_missing",
      severity: "warning",
      message:
        "No persistent audit log path is configured for production. Set TRACECHECK_AUDIT_LOG_PATH to retain operational evidence.",
    });
  }

  if (config.maxUploadFileSizeMb > 50) {
    diagnostics.push({
      code: "uploads.max_size_high",
      severity: "warning",
      message:
        "TRACECHECK_MAX_FILE_SIZE_MB is set above 50 MB. Consider lowering the ceiling for safer upload handling.",
    });
  }

  return diagnostics;
};

export const getRolePermissions = (roles: ActorRole[]) =>
  unique(roles.flatMap((role) => rolePermissionMap[role]));
