# TraceCheck AI

TraceCheck AI is a hackathon prototype for pharma incoming-material verification. It helps receiving or QA teams compare a delivery note, certificate of analysis, and material label before releasing a batch into production.

## Repo structure

- `frontend/` contains the Vite + React product UI
- `backend/` contains the Express API and the Azure Functions app
- `shared/` contains the TraceCheck domain types and validation logic used by the frontend and Express API

## What is live

- Multi-page React + TypeScript frontend built with Vite
- Shared routed product shell with landing, features, and workspace pages
- Node + TypeScript API layer for secure Azure integration
- API-backed field extraction for uploaded documents
- Editable field-review workflow with OCR baseline restore and approval state
- Cross-document validation and mismatch detection
- Risk scoring and `release / manual review / hold` recommendation
- Exportable verification report

## Azure integration layer

- `GET /api/integration/status` reports whether Azure Document Intelligence is configured
- `POST /api/documents/extract` extracts text and fields from uploaded documents
- `POST /api/analysis` returns the current TraceCheck decision payload
- Binary image and PDF uploads use Azure Document Intelligence when credentials are configured
- Text uploads stay fast by using direct API-side parsing plus TraceCheck field extraction

## Azure Functions deployment structure

- A standalone Azure Functions v4 TypeScript app now lives in `backend/function-app/`
- It mirrors the same backend routes as the local Express API:
  - `GET /api/integration/status`
  - `POST /api/documents/extract`
  - `POST /api/analysis`
- Use this when you want a real Azure deployment target instead of the local development server

## What is mocked or fallback-only

- OCR for binary files when Azure credentials are missing
- ERP and supplier master-data integration
- Historical analytics and approval workflow

## Getting started

```bash
npm install
npm run dev
```

This starts both:

- the frontend in `frontend/`
- the Express API in `backend/` on port `8787`

If you only want the frontend:

```bash
npm run dev:frontend
```

If you only want the Express backend:

```bash
npm run dev:backend
```

If you want the Azure Function App instead:

```bash
npm run dev:functions
```

Build every app:

```bash
npm run build
```

Preview the frontend bundle:

```bash
npm run preview
```

Run the split app with Docker Compose:

```bash
npm run docker:up
```

That stack exposes:

- frontend on `http://127.0.0.1:4173`
- backend on `http://127.0.0.1:8787`

## Azure setup

Copy `backend/.env.example` to `backend/.env` and fill in:

```bash
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=
AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-read
PORT=8787
```

Copy `frontend/.env.example` to `frontend/.env` when you want to override the default API wiring:

```bash
TRACECHECK_DEV_API_TARGET=http://127.0.0.1:8787
VITE_TRACECHECK_API_BASE_URL=
```

Without these values, the app still works in fallback mode and the API status endpoint will report that Azure is not configured.

Frontend wiring options:

- Default local Express API:
  - Keep `TRACECHECK_DEV_API_TARGET=http://127.0.0.1:8787`
- Docker Compose preview proxy:
  - Set `TRACECHECK_PREVIEW_API_TARGET=http://backend:8787` inside the frontend container
- Local Azure Functions host:
  - Set `TRACECHECK_DEV_API_TARGET=http://127.0.0.1:7071`
- Deployed Azure Function App:
  - Set `VITE_TRACECHECK_API_BASE_URL=https://<your-function-app>.azurewebsites.net`
  - The frontend will call the same `/api/...` routes against that base URL

If the frontend is served from a different domain than the deployed Function App, configure Azure CORS on the Function App to allow the frontend origin.

## Docker compose

The root `docker-compose.yml` is set up for the split repo structure:

- `frontend` builds the Vite app, serves it with `vite preview`, and proxies `/api` to the backend container
- `backend` runs the Express API directly from the split `backend/` workspace
- Azure credentials remain optional, so the compose stack still boots in fallback mode without extra secrets

Optional Azure values can be injected into Docker Compose from your shell or a root `.env` file:

```bash
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=
AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-read
```

Useful commands:

- `npm run docker:build`
- `npm run docker:up`
- `npm run docker:up:detached`
- `npm run docker:down`
- `npm run docker:logs`

## Operational flow

1. Open the landing page and navigate to the workspace.
2. Upload the three incoming material documents.
3. Review the extracted fields and correct OCR misses if needed.
4. Confirm the validation matrix and flagged discrepancies.
5. Approve reviewed documents and export the verification report.
6. Use the Azure status card to explain the deployment path.

## Suggested Azure architecture

- Azure Static Web Apps for hosting
- Azure Functions or a serverless API layer for validation orchestration
- Azure AI Document Intelligence for structured document extraction
- Azure Vision for OCR on material-label images
- Azure Language for plain-language explanation or summarization

## Notes

- The current app is intentionally honest about what is live and what remains roadmap work.
- The Azure integration layer is safe by default: when credentials are missing or a request fails, TraceCheck falls back instead of breaking the workflow.
