import type {
  Request,
  RequestHandler,
  Response,
} from "express";
import { ApiError } from "./api-error";
import { buildSessionActor } from "./auth-service";
import { recordAuditEvent } from "./audit-service";
import {
  getAllPermissions,
  getRuntimeConfig,
  type AuthMode,
  type Permission,
} from "./runtime-config-service";
import { incrementCounter } from "./observability-service";

export type RequestActor = {
  actorId: string;
  permissions: Permission[];
  roles: string[];
  authMode: AuthMode;
  authSource: "development-bypass" | "bearer" | "x-api-key";
};

type ResponseLocals = {
  actor?: RequestActor;
  requestId?: string;
};

const getLocals = (response: Response) => response.locals as ResponseLocals;

export type RequestAuthToken = {
  source: "bearer" | "x-api-key";
  token: string;
};

export const getRequestAuthToken = (
  request: Request,
): RequestAuthToken | undefined => {
  const authorization = request.headers.authorization?.trim();
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return {
      source: "bearer" as const,
      token: authorization.slice(7).trim(),
    };
  }

  const apiKey = request.headers["x-api-key"];
  if (typeof apiKey === "string" && apiKey.trim()) {
    return {
      source: "x-api-key" as const,
      token: apiKey.trim(),
    };
  }

  return undefined;
};

const buildDevelopmentActor = (): RequestActor => ({
  actorId: "development-bypass",
  permissions: getAllPermissions(),
  roles: ["ops-admin"],
  authMode: "disabled",
  authSource: "development-bypass",
});

const getRequestIp = (request: Request) =>
  request.ip || request.socket.remoteAddress || "unknown";

export const setResponseRequestId = (response: Response, requestId: string) => {
  getLocals(response).requestId = requestId;
};

export const getResponseRequestId = (response: Response) =>
  getLocals(response).requestId ?? "unknown-request";

export const getResponseActor = (response: Response) => getLocals(response).actor;

const setResponseActor = (response: Response, actor: RequestActor) => {
  getLocals(response).actor = actor;
};

export const authenticateRequest: RequestHandler = async (request, response, next) => {
  const config = getRuntimeConfig();
  const token = getRequestAuthToken(request);
  const sessionActor =
    token?.source === "bearer" ? await buildSessionActor(token.token) : undefined;
  if (sessionActor) {
    setResponseActor(response, sessionActor);
    next();
    return;
  }

  if (config.authMode === "disabled") {
    setResponseActor(response, buildDevelopmentActor());
    next();
    return;
  }

  if (!token?.token) {
    incrementCounter("auth.denied", { reason: "missing_token" });
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      requestId: getResponseRequestId(response),
      actorId: "anonymous",
      action: "auth.authenticate",
      resource: request.path,
      outcome: "denied",
      details: {
        method: request.method,
        requestIp: getRequestIp(request),
        reason: "missing_token",
      },
    });
    next(new ApiError(
      401,
      "Authentication is required for this endpoint.",
      {
        "WWW-Authenticate": 'Bearer realm="TraceCheck API"',
      },
    ));
    return;
  }

  if (config.authMode === "session") {
    incrementCounter("auth.denied", { reason: "invalid_session" });
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      requestId: getResponseRequestId(response),
      actorId: "unknown-session",
      action: "auth.authenticate",
      resource: request.path,
      outcome: "denied",
      details: {
        method: request.method,
        requestIp: getRequestIp(request),
        reason: "invalid_session",
      },
    });
    next(new ApiError(
      401,
      "Your sign-in session is no longer valid.",
      {
        "WWW-Authenticate": 'Bearer error="invalid_token"',
      },
    ));
    return;
  }

  const actorConfig = config.authTokens.find((entry) => entry.token === token.token);
  if (!actorConfig) {
    incrementCounter("auth.denied", { reason: "invalid_token" });
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      requestId: getResponseRequestId(response),
      actorId: "unknown-token",
      action: "auth.authenticate",
      resource: request.path,
      outcome: "denied",
      details: {
        method: request.method,
        requestIp: getRequestIp(request),
        reason: "invalid_token",
      },
    });
    next(new ApiError(
      401,
      "The provided API credentials are invalid.",
      {
        "WWW-Authenticate": 'Bearer error="invalid_token"',
      },
    ));
    return;
  }

  setResponseActor(response, {
    actorId: actorConfig.actorId,
    permissions: actorConfig.permissions,
    roles: actorConfig.roles,
    authMode: config.authMode,
    authSource: token.source,
  });
  next();
};

export const requirePermission = (permission: Permission): RequestHandler =>
  (request, response, next) => {
    const actor = getResponseActor(response);
    if (actor?.permissions.includes(permission)) {
      next();
      return;
    }

    incrementCounter("auth.denied", { reason: "permission_denied", permission });
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      requestId: getResponseRequestId(response),
      actorId: actor?.actorId ?? "anonymous",
      action: "auth.authorize",
      resource: request.path,
      outcome: "denied",
      details: {
        method: request.method,
        permission,
        roles: actor?.roles ?? [],
      },
    });
    next(new ApiError(403, `Missing permission: ${permission}.`));
  };

export const requireWriteOperationsEnabled = (
  operation: string,
): RequestHandler => (request, response, next) => {
  if (!getRuntimeConfig().freezeWriteOperations) {
    next();
    return;
  }

  incrementCounter("operations.write_frozen", { operation });
  recordAuditEvent({
    timestamp: new Date().toISOString(),
    requestId: getResponseRequestId(response),
    actorId: getResponseActor(response)?.actorId ?? "anonymous",
    action: "operations.write-blocked",
    resource: operation,
    outcome: "denied",
    details: {
      method: request.method,
      path: request.path,
    },
  });
  next(new ApiError(
    503,
    "Write operations are temporarily frozen by operational policy.",
  ));
};
