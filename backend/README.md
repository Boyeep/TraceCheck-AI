# TraceCheck Backend

This workspace contains the Express API for TraceCheck AI, including document extraction, analysis, auth/session handling, operational endpoints, and PostgreSQL-backed persistence for users and sessions.

## Stack

- Node.js
- Express 5
- TypeScript
- PostgreSQL via `pg`
- `pg-mem` for lightweight in-memory development and tests
- Multer for uploads

## Main Responsibilities

- `POST /api/auth/signup`, `login`, `session`, and `logout`
- `GET /api/integration/status`
- `POST /api/documents/extract`
- `POST /api/analysis`
- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /api/ops/metrics`
- `GET /api/ops/audit/recent`

## Key Paths

- `src/index.ts` for startup and DB bootstrap
- `src/app.ts` for middleware and route registration
- `src/routes/` for API route modules
- `src/services/auth-service.ts` for auth/session orchestration
- `src/services/auth-repository.ts` for persisted auth data access
- `src/services/database-service.ts` for DB connection and migration bootstrap
- `src/db/migrations/` for SQL migrations
- `src/services/runtime-config-service.ts` for env parsing and diagnostics

## Local Development

From the repo root:

```bash
npm run dev:backend
```

From `backend/` directly:

```bash
npm run dev
```

Build/check:

```bash
npm run build:backend
npm run check:backend
```

From `backend/` directly:

```bash
npm run build
npm run check
```

## Environment Variables

Copy `.env.example` to `.env` and fill in what you need:

```bash
PORT=8787
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=
AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-read
TRACECHECK_SERVICE_NAME=tracecheck-backend
TRACECHECK_AUTH_MODE=session
TRACECHECK_API_TOKENS=ops-admin:replace-me:ops-admin,qa-operator:replace-me:qa-operator
TRACECHECK_DATABASE_DRIVER=postgres
TRACECHECK_DATABASE_URL=postgresql://tracecheck:tracecheck@127.0.0.1:5432/tracecheck
TRACECHECK_DATABASE_SSL=false
TRACECHECK_DATABASE_AUTO_MIGRATE=true
```

Important runtime behavior:

- `TRACECHECK_AUTH_MODE=session` enables the frontend-facing login/sign-up flow
- `TRACECHECK_AUTH_MODE=api-key` keeps the static token path available for service-style access
- `TRACECHECK_AUTH_MODE=disabled` bypasses auth for local/internal development
- `TRACECHECK_DATABASE_DRIVER=postgres` expects `TRACECHECK_DATABASE_URL` or `DATABASE_URL`
- `TRACECHECK_DATABASE_DRIVER=pg-mem` uses an in-memory database instead
- if no explicit driver or DB URL is provided in non-production development, the backend can fall back to `pg-mem`

## PostgreSQL And Migrations

The backend auto-runs SQL migrations on startup when `TRACECHECK_DATABASE_AUTO_MIGRATE=true`.

Current auth persistence tables:

- `auth_users`
- `auth_sessions`
- `tracecheck_schema_migrations`

Migration source:

- `src/db/migrations/001_auth_tables.sql`

Session security model:

- bearer session tokens are returned to the client once
- only a SHA-256 hash of each session token is stored in the database
- user passwords are stored as derived hashes with salts

## Auth And Permissions

Frontend/session routes:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`

Permission-protected backend routes still use the shared auth middleware and role/permission model from `runtime-config-service.ts`.

Built-in roles:

- `qa-operator`
- `qa-supervisor`
- `ops-admin`
- `auditor`

## Health And Ops Endpoints

- `GET /api/health/live` for basic liveness
- `GET /api/health/ready` for readiness, auth mode, database config, upload limits, and integration diagnostics
- `GET /api/ops/metrics` for in-memory counters and request timing summaries
- `GET /api/ops/audit/recent` for recent audit events

## Testing

Run backend tests from the repo root:

```bash
npm run test:backend
```

From `backend/` directly:

```bash
npm run test
```

Coverage currently includes:

- integration-status matrix tests
- route smoke tests
- auth route tests
- security controls

The auth tests also verify:

- migrations run on boot
- sessions are persisted
- session tokens are stored hashed, not raw

## Docker And Compose

The root `docker-compose.yml` brings up:

- `postgres`
- `backend`
- `frontend`

Useful root commands:

```bash
npm run docker:up
npm run docker:up:detached
npm run docker:down
npm run docker:logs
```

## Azure Function Variant

This workspace also contains `function-app/`, which mirrors the API routes for Azure Functions deployment. Use [function-app/README.md](./function-app/README.md) for that path specifically.
