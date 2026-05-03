import type {
  AnalyzeDocumentsResponse,
  AzureIntegrationStatus,
  DocumentKind,
  ExtractDocumentResponse,
  SourceMode,
  TraceDocument,
} from "../../../shared/types";
import {
  getStoredAuthSession,
  type AuthSession,
} from "../auth/auth-storage";
import { createTraceDocument } from "../../../shared/trace-document";
import {
  analyzeDocuments,
  createEmptyAnalysis,
  extractFields,
  prepareDocumentForReview,
} from "../../../shared/tracecheck";
import {
  buildFallbackBinaryText,
  isTextLikeUpload,
} from "../../../shared/uploads";

const configuredApiBaseUrl = (import.meta.env.VITE_TRACECHECK_API_BASE_URL ?? "")
  .trim()
  .replace(/\/+$/, "");
const configuredApiToken = (import.meta.env.VITE_TRACECHECK_API_TOKEN ?? "").trim();
const configuredApiKey = (import.meta.env.VITE_TRACECHECK_API_KEY ?? "").trim();

const buildApiUrl = (path: string) =>
  configuredApiBaseUrl ? `${configuredApiBaseUrl}${path}` : path;

const getApiErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as {
      message?: string;
    };
    if (payload.message) {
      return payload.message;
    }
  } catch {
    // Ignore invalid JSON payloads and fall back to the HTTP status message.
  }

  return `Request failed with ${response.status}.`;
};

export class ApiRequestError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
  }
}

const buildApiHeaders = (
  headers?: HeadersInit,
  options?: {
    authToken?: string;
    includeStoredAuth?: boolean;
  },
) => {
  const nextHeaders = new Headers(headers);
  const storedSessionToken =
    options?.includeStoredAuth === false
      ? undefined
      : getStoredAuthSession()?.token;
  const authToken = options?.authToken ?? storedSessionToken;

  if (authToken && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", `Bearer ${authToken}`);
  } else if (configuredApiToken && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", `Bearer ${configuredApiToken}`);
  } else if (configuredApiKey && !nextHeaders.has("X-API-Key")) {
    nextHeaders.set("X-API-Key", configuredApiKey);
  }

  return nextHeaders;
};

const unreachableApiLabel = configuredApiBaseUrl
  ? `The configured TraceCheck API at ${configuredApiBaseUrl} could not be reached, so the frontend is using the local fallback path.`
  : "The TraceCheck API could not be reached, so the frontend is using the local fallback path.";

export const defaultIntegrationStatus: AzureIntegrationStatus = {
  mode: "fallback",
  readiness: {
    binaryOcr: "fallback",
    fieldExtraction: "fallback",
    decisionSummary: "fallback",
  },
  documentIntelligenceConfigured: false,
  openAiConfigured: false,
  modelId: "prebuilt-read",
  extractionStrategy: "rule-engine",
  explanationStrategy: "rule-engine",
  reason: unreachableApiLabel,
};

const createLocalDocument = async (
  kind: DocumentKind,
  file: File,
): Promise<TraceDocument> => {
  const sourceMode: SourceMode = isTextLikeUpload(file.name, file.type)
    ? "uploaded-text"
    : "uploaded-binary";

  if (sourceMode === "uploaded-text") {
    const rawText = await file.text();
    return prepareDocumentForReview(createTraceDocument({
      kind,
      fileName: file.name,
      rawText,
      sourceMode,
      contentType: file.type || "text/plain",
      confidence: 0.84,
      extractedFields: extractFields(rawText),
      notes: [
        "Processed locally in the browser because the TraceCheck API was unavailable.",
      ],
      processingSource: "server-fallback",
      serviceLabel: "Browser fallback",
    }));
  }

  const rawText = buildFallbackBinaryText(file.name, "Browser fallback");

  return prepareDocumentForReview(createTraceDocument({
    kind,
    fileName: file.name,
    rawText,
    sourceMode,
    contentType: file.type || "application/octet-stream",
    confidence: 0.55,
    extractedFields: extractFields(rawText),
    notes: [
      "Binary upload stayed in fallback mode because the backend API was unavailable.",
    ],
    processingSource: "server-fallback",
    serviceLabel: "Browser fallback",
  }));
};

export const fetchIntegrationStatus = async (): Promise<AzureIntegrationStatus> => {
  try {
    const response = await fetch(buildApiUrl("/api/integration/status"), {
      headers: buildApiHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ApiRequestError(response.status, await getApiErrorMessage(response));
      }

      throw new Error(`Status request failed with ${response.status}`);
    }

    return (await response.json()) as AzureIntegrationStatus;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    return defaultIntegrationStatus;
  }
};

export const extractDocumentWithApi = async (
  kind: DocumentKind,
  file: File,
): Promise<ExtractDocumentResponse> => {
  try {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch(buildApiUrl("/api/documents/extract"), {
      headers: buildApiHeaders(),
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ApiRequestError(response.status, await getApiErrorMessage(response));
      }

      throw new Error(`Extraction request failed with ${response.status}`);
    }

    const payload = (await response.json()) as ExtractDocumentResponse;

    return {
      ...payload,
      document: prepareDocumentForReview(payload.document),
    };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    return {
      document: await createLocalDocument(kind, file),
      integrationStatus: defaultIntegrationStatus,
    };
  }
};

export const analyzeDocumentsWithApi = async (
  documents: TraceDocument[],
): Promise<AnalyzeDocumentsResponse> => {
  try {
    const response = await fetch(buildApiUrl("/api/analysis"), {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ documents }),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new ApiRequestError(response.status, await getApiErrorMessage(response));
      }

      throw new Error(`Analysis request failed with ${response.status}`);
    }

    return (await response.json()) as AnalyzeDocumentsResponse;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    return {
      analysis: documents.length ? analyzeDocuments(documents) : createEmptyAnalysis(),
      integrationStatus: defaultIntegrationStatus,
    };
  }
};

export const signUpWithApi = async ({
  email,
  name,
  password,
}: {
  email: string;
  name: string;
  password: string;
}): Promise<AuthSession> => {
  const response = await fetch(buildApiUrl("/api/auth/signup"), {
    method: "POST",
    headers: buildApiHeaders(
      {
        "Content-Type": "application/json",
      },
      {
        includeStoredAuth: false,
      },
    ),
    body: JSON.stringify({ email, name, password }),
  });

  if (!response.ok) {
    throw new ApiRequestError(response.status, await getApiErrorMessage(response));
  }

  return (await response.json()) as AuthSession;
};

export const loginWithApi = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthSession> => {
  const response = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: buildApiHeaders(
      {
        "Content-Type": "application/json",
      },
      {
        includeStoredAuth: false,
      },
    ),
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new ApiRequestError(response.status, await getApiErrorMessage(response));
  }

  return (await response.json()) as AuthSession;
};

export const fetchAuthSession = async (authToken?: string): Promise<AuthSession> => {
  const response = await fetch(buildApiUrl("/api/auth/session"), {
    headers: buildApiHeaders(undefined, {
      authToken,
      includeStoredAuth: authToken ? false : true,
    }),
  });

  if (!response.ok) {
    throw new ApiRequestError(response.status, await getApiErrorMessage(response));
  }

  return (await response.json()) as AuthSession;
};

export const logoutWithApi = async (authToken?: string) => {
  const response = await fetch(buildApiUrl("/api/auth/logout"), {
    method: "POST",
    headers: buildApiHeaders(undefined, {
      authToken,
      includeStoredAuth: authToken ? false : true,
    }),
  });

  if (!response.ok) {
    throw new ApiRequestError(response.status, await getApiErrorMessage(response));
  }
};
