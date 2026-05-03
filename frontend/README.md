# TraceCheck Frontend

This workspace contains the React + Vite UI for TraceCheck AI, including the landing page, feature pages, workspace flow, and session-based auth screens.

## Stack

- React 19
- TypeScript
- React Router
- Vite
- Playwright for repo-level browser smoke tests

## Main Responsibilities

- Marketing and product shell pages
- Login and sign-up flows
- Guarded workspace navigation
- Upload, review, validate, and decision screens
- Browser-side fallback behavior when the API is unavailable
- Auth-aware API calls into the Express backend

## Key Paths

- `src/App.tsx` for route composition
- `src/auth/` for auth context, local session storage, and route guards
- `src/api/client.ts` for backend API integration
- `src/workspace/` for workspace state and flow orchestration
- `src/components/` and `src/pages/` for UI composition
- `src/styles.css` for the app-wide visual system

## Local Development

From the repo root:

```bash
npm run dev:frontend
```

From `frontend/` directly:

```bash
npm run dev
```

Default dev behavior:

- Vite serves the UI locally
- `/api` calls proxy to `TRACECHECK_DEV_API_TARGET`
- if the backend is unreachable, the frontend drops into its local fallback path for extraction/analysis

## Environment Variables

Copy `.env.example` to `.env` when you want to override the defaults:

```bash
TRACECHECK_DEV_API_TARGET=http://127.0.0.1:8787
TRACECHECK_PREVIEW_API_TARGET=
VITE_TRACECHECK_API_BASE_URL=
```

Optional auth/API overrides supported by the client:

- `VITE_TRACECHECK_API_TOKEN`
- `VITE_TRACECHECK_API_KEY`

Typical wiring choices:

- Local Express backend:
  - `TRACECHECK_DEV_API_TARGET=http://127.0.0.1:8787`
- Docker preview stack:
  - `TRACECHECK_PREVIEW_API_TARGET=http://backend:8787`
- Azure Functions host:
  - `TRACECHECK_DEV_API_TARGET=http://127.0.0.1:7071`
- Remote deployed API:
  - `VITE_TRACECHECK_API_BASE_URL=https://<your-api-host>`

## Auth UX Flow

- Logged-out navbar actions show `Login` and `Sign up`
- Workspace routes redirect through the login flow when no valid session is present
- Successful sign-up or login returns the user to the requested workspace route
- Session state is cached in local storage and revalidated against `/api/auth/session`
- `401` or `403` responses from auth-protected API calls sign the user out instead of silently continuing in a fake authenticated state

## Build And Preview

From the repo root:

```bash
npm run build:frontend
npm run preview
```

From `frontend/` directly:

```bash
npm run build
npm run preview
```

## E2E Coverage

Repo-level Playwright smoke tests live in `../e2e/` and are run from the repo root:

```bash
npm run test:e2e
```

Current smoke coverage includes:

- signed-out redirect into login
- navbar auth actions
- sign-up into the guarded workspace
- text-document upload path

## Notes For Frontend Changes

- If you change auth routes or labels, update the Playwright smoke tests.
- If you change API behavior, check `src/api/client.ts` and `src/workspace/workspace-provider.tsx` together.
- If you need backend route, database, or ops details, use [../backend/README.md](../backend/README.md).
