# TraceCheck Shared Layer

This folder contains shared domain logic and types used by both the frontend and backend.

## Purpose

`shared/` exists so TraceCheck’s document model, field extraction rules, analysis contracts, and upload helpers stay consistent across the browser and the API.

Use this folder for logic that should mean the same thing everywhere:

- domain types and API payload types
- document creation and normalization helpers
- field extraction and analysis logic
- upload-mode helpers
- server-shared response builders that are still part of the core TraceCheck contract

## Main Entry Points

- `types.ts` re-exports the shared contract types
- `tracecheck.ts` re-exports the core TraceCheck analysis and extraction helpers
- `trace-document.ts` builds normalized `TraceDocument` objects
- `uploads.ts` contains upload-mode detection and fallback text helpers

## Folder Shape

- `types/` for shared TypeScript contracts
- `tracecheck/` for domain logic such as extraction, normalization, review prep, and analysis
- `server/` for server-oriented shared helpers like integration status builders and upload response composition

## Boundary Rules

Good fits for `shared/`:

- logic needed by both frontend and backend
- serializable contracts passed over the API
- deterministic business rules
- helpers that should stay framework-agnostic

Bad fits for `shared/`:

- React components or hooks
- Express middleware or route handlers
- database access
- environment-variable parsing
- infrastructure-specific logging or monitoring code

## Browser-Safe Vs Server-Only

- Top-level shared files like `types.ts`, `tracecheck.ts`, `trace-document.ts`, and `uploads.ts` are intended to stay browser-safe.
- `shared/server/` is for backend-facing shared helpers and should not be treated as frontend-safe by default.

## When To Change Shared Code

Reach for `shared/` when:

- a frontend fallback path and backend API path should produce the same result
- a new API payload needs a canonical type
- a new document rule or recommendation rule should be applied consistently everywhere

If a change is only about UI rendering, request handling, auth, or database persistence, it probably belongs outside `shared/`.
