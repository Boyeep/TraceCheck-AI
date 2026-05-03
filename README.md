# TraceCheck AI

TraceCheck AI is a pharma incoming-material verification app. It helps receiving and QA teams compare a delivery note, certificate of analysis, and material label before releasing a batch into production.

## What This Repo Contains

- `frontend/` for the React + Vite product UI
- `backend/` for the Express API, auth/session layer, and PostgreSQL-backed operations stack
- `backend/function-app/` for the Azure Functions deployment variant
- `shared/` for shared domain types, upload helpers, and TraceCheck decision logic
- `e2e/` for Playwright browser smoke coverage
- `perf/` for the lightweight load/perf smoke script

## Documentation Map

- [frontend/README.md](./frontend/README.md) for frontend setup, API wiring, auth UI flow, and E2E notes
- [backend/README.md](./backend/README.md) for backend routes, auth/session persistence, PostgreSQL setup, migrations, and ops endpoints
- [backend/function-app/README.md](./backend/function-app/README.md) for the Azure Functions deployment target

## Current Product Scope

Live today:

- Multi-page React UI with landing, features, and workspace flows
- Document upload and field extraction
- Reviewable OCR output with editable field corrections
- Cross-document mismatch checks and decision summaries
- Session auth with persistent users and sessions
- PostgreSQL-backed backend runtime with readiness, metrics, and audit scaffolding

Still mocked or fallback-only:

- ERP and supplier master-data integration
- Historical analytics and approval workflow orchestration
- Full production observability stack beyond the current local/webhook scaffold

## Quick Start

Install everything:

```bash
npm install
```

Run frontend and backend together:

```bash
npm run dev
```

That starts:

- frontend on `http://127.0.0.1:5173` in normal Vite dev mode
- backend on `http://127.0.0.1:8787`

## Common Commands

From the repo root:

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run dev:functions
npm run build
npm run test:backend
npm run test:e2e
npm run test:perf
npm run ci
```

Container workflow:

```bash
npm run docker:build
npm run docker:up
npm run docker:up:detached
npm run docker:down
npm run docker:logs
```

## Local Architecture

- The frontend talks to `/api/...` routes through the local Vite proxy in development.
- The Express backend handles auth, uploads, analysis, readiness, metrics, and audit endpoints.
- Shared business logic lives in `shared/` so frontend fallback behavior and backend decision logic stay aligned.
- When session auth is enabled, backend users and sessions live in PostgreSQL. In development, the backend can fall back to `pg-mem` if no database URL is configured.

## Recommended Reading Order

1. Start here for repo-level orientation.
2. Open [frontend/README.md](./frontend/README.md) if you are changing UI, routing, auth screens, or browser tests.
3. Open [backend/README.md](./backend/README.md) if you are changing API routes, auth/session behavior, PostgreSQL setup, or operational endpoints.
