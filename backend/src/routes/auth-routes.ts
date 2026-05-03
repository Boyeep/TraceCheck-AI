import type { Express, Request } from "express";
import { ApiError } from "../services/api-error";
import {
  authenticateUser,
  getAuthSession,
  registerUser,
  revokeAuthSession,
} from "../services/auth-service";
import { recordAuditEvent } from "../services/audit-service";
import { incrementCounter } from "../services/observability-service";
import { applyRateLimit } from "../services/rate-limit-service";
import {
  getRequestAuthToken,
  getResponseRequestId,
} from "../services/security-service";

const getBearerToken = (request: Request) => {
  const token = getRequestAuthToken(request);
  return token?.source === "bearer" ? token.token : undefined;
};

const requireBearerToken = (request: Request) => {
  const token = getBearerToken(request);
  if (!token) {
    throw new ApiError(
      401,
      "A valid sign-in session is required.",
      {
        "WWW-Authenticate": 'Bearer realm="TraceCheck API"',
      },
    );
  }

  return token;
};

export const registerAuthRoutes = (app: Express) => {
  app.post("/api/auth/signup", applyRateLimit("auth"), async (request, response) => {
    const requestId = getResponseRequestId(response);
    const name = typeof request.body?.name === "string" ? request.body.name : "";
    const email = typeof request.body?.email === "string" ? request.body.email : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";

    try {
      const session = await registerUser({ name, email, password });
      incrementCounter("auth.signup.success");
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        requestId,
        actorId: session.user.userId,
        action: "auth.signup",
        resource: session.user.email,
        outcome: "success",
        details: {
          roles: session.user.roles,
        },
      });
      response.status(201).json(session);
    } catch (error) {
      incrementCounter("auth.signup.failed");
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        requestId,
        actorId: "anonymous",
        action: "auth.signup",
        resource: email.trim().toLowerCase() || "unknown-email",
        outcome: "denied",
        details: {
          message: error instanceof Error ? error.message : "Unknown signup error.",
        },
      });
      throw error;
    }
  });

  app.post("/api/auth/login", applyRateLimit("auth"), async (request, response) => {
    const requestId = getResponseRequestId(response);
    const email = typeof request.body?.email === "string" ? request.body.email : "";
    const password =
      typeof request.body?.password === "string" ? request.body.password : "";

    try {
      const session = await authenticateUser({ email, password });
      incrementCounter("auth.login.success");
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        requestId,
        actorId: session.user.userId,
        action: "auth.login",
        resource: session.user.email,
        outcome: "success",
        details: {
          roles: session.user.roles,
        },
      });
      response.json(session);
    } catch (error) {
      incrementCounter("auth.login.failed");
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        requestId,
        actorId: "anonymous",
        action: "auth.login",
        resource: email.trim().toLowerCase() || "unknown-email",
        outcome: "denied",
        details: {
          message: error instanceof Error ? error.message : "Unknown login error.",
        },
      });
      throw error;
    }
  });

  app.get("/api/auth/session", applyRateLimit("auth"), async (request, response) => {
    const token = requireBearerToken(request);
    const session = await getAuthSession(token);
    if (!session) {
      throw new ApiError(
        401,
        "Your sign-in session is no longer valid.",
        {
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      );
    }

    response.json(session);
  });

  app.post("/api/auth/logout", applyRateLimit("auth"), async (request, response) => {
    const token = getBearerToken(request);
    if (!token) {
      response.status(204).end();
      return;
    }

    const session = await getAuthSession(token);
    if (!session) {
      response.status(204).end();
      return;
    }
    recordAuditEvent({
      timestamp: new Date().toISOString(),
      requestId: getResponseRequestId(response),
      actorId: session.user.userId,
      action: "auth.logout",
      resource: session.user.email,
      outcome: "success",
    });
    await revokeAuthSession(token);

    response.status(204).end();
  });
};
