# TraceCheck Azure Function App

This folder contains a standalone Azure Functions v4 TypeScript backend for TraceCheck AI. It mirrors the current local API routes so the frontend can later be pointed at a deployed Function App with minimal changes.

It now lives under `backend/function-app/` as part of the split frontend/backend repo structure.

## Routes

- `GET /api/integration/status`
- `POST /api/documents/extract`
- `POST /api/analysis`

## Local setup

1. Copy `local.settings.sample.json` to `local.settings.json`.
2. Set Azure credentials if you want live OCR:
   - `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
   - `AZURE_DOCUMENT_INTELLIGENCE_KEY`
   - optional `AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID`
3. Install dependencies:

```bash
npm install
```

4. Start the Function App locally:

```bash
npm start
```

This requires Azure Functions Core Tools to be installed locally.

## Build only

```bash
npm run build
```

## Deploy

With Azure Functions Core Tools installed and an existing Function App resource created in Azure, publish with:

```bash
func azure functionapp publish <APP_NAME>
```

Microsoft documents `func azure functionapp publish` as the project-files deployment command for Azure Functions Core Tools.

## Frontend connection

To point the TraceCheck frontend at a deployed Function App, set:

```bash
VITE_TRACECHECK_API_BASE_URL=https://<APP_NAME>.azurewebsites.net
```

The frontend will keep calling the same `/api/...` paths against that base URL.

## Notes

- Text uploads are parsed directly in the function app.
- Binary uploads use Azure Document Intelligence when credentials are configured.
- If Azure credentials are missing or OCR fails, the function app returns a safe fallback payload instead of breaking the workflow.
