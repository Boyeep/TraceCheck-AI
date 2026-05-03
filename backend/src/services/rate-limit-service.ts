import type { RequestHandler } from "express";
import { ApiError } from "./api-error";
import { recordAuditEvent } from "./audit-service";
import {
  getRuntimeConfig,
  type RateLimitBucketName,
} from "./runtime-config-service";
import {
  getResponseActor,
  getResponseRequestId,
} from "./security-service";
import { incrementCounter } from "./observability-service";

type BucketState = {
  count: number;
  resetAt: number;
};

const bucketStore = new Map<string, BucketState>();

const getClientKey = (requestIp: string | undefined, fallbackKey: string) =>
  requestIp?.trim() || fallbackKey;

const getRateLimitKey = ({
  bucket,
  actorId,
  requestIp,
}: {
  bucket: RateLimitBucketName;
  actorId: string;
  requestIp?: string;
}) => `${bucket}:${actorId}:${getClientKey(requestIp, "unknown-client")}`;

export const applyRateLimit = (bucket: RateLimitBucketName): RequestHandler =>
  (request, response, next) => {
    const config = getRuntimeConfig().rateLimits[bucket];
    const actor = getResponseActor(response);
    const requestId = getResponseRequestId(response);
    const actorId = actor?.actorId ?? "anonymous";
    const requestIp = request.ip || request.socket.remoteAddress || undefined;
    const key = getRateLimitKey({
      bucket,
      actorId,
      requestIp,
    });
    const now = Date.now();
    const state = bucketStore.get(key);
    const activeState =
      state && state.resetAt > now
        ? state
        : {
            count: 0,
            resetAt: now + config.windowMs,
          };

    activeState.count += 1;
    bucketStore.set(key, activeState);

    const remaining = Math.max(0, config.maxRequests - activeState.count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((activeState.resetAt - now) / 1000),
    );

    response.setHeader("X-RateLimit-Limit", String(config.maxRequests));
    response.setHeader("X-RateLimit-Remaining", String(remaining));
    response.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil(activeState.resetAt / 1000)),
    );

    if (activeState.count > config.maxRequests) {
      incrementCounter("rate_limit.exceeded", { bucket });
      recordAuditEvent({
        timestamp: new Date().toISOString(),
        requestId,
        actorId,
        action: "rate-limit.blocked",
        resource: bucket,
        outcome: "denied",
        details: {
          method: request.method,
          path: request.path,
          requestIp,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
        },
      });
      next(new ApiError(
        429,
        `Rate limit exceeded for ${bucket} requests. Retry later.`,
        {
          "Retry-After": String(retryAfterSeconds),
        },
      ));
      return;
    }

    next();
  };

export const resetRateLimitState = () => {
  bucketStore.clear();
};
