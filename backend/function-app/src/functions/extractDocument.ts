import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { app } from "../app";
import {
  buildIntegrationStatus,
  extractDocumentFromBinary,
  extractDocumentFromText,
  isTextLikeUpload,
} from "../lib/integration";
import type {
  DocumentKind,
  ExtractDocumentResponse,
} from "../../../../shared/types";

const documentKinds: DocumentKind[] = ["deliveryNote", "coa", "materialLabel"];

const jsonResponse = (body: unknown, status = 200): HttpResponseInit => ({
  status,
  jsonBody: body,
  headers: {
    "Cache-Control": "no-store",
  },
});

const isDocumentKind = (value: string): value is DocumentKind =>
  documentKinds.includes(value as DocumentKind);

const badRequest = (message: string): HttpResponseInit =>
  jsonResponse(
    {
      message,
      integrationStatus: buildIntegrationStatus(),
    },
    400,
  );

const parseJsonUpload = async (request: HttpRequest) => {
  const payload = (await request.json()) as {
    kind?: string;
    fileName?: string;
    contentType?: string;
    rawText?: string;
    base64Content?: string;
  };

  if (!payload.kind || !isDocumentKind(payload.kind)) {
    throw new Error("A valid document kind is required.");
  }

  if (typeof payload.rawText === "string") {
    return extractDocumentFromText({
      kind: payload.kind,
      fileName: payload.fileName ?? `${payload.kind}.txt`,
      contentType: payload.contentType ?? "text/plain",
      rawText: payload.rawText,
    });
  }

  if (typeof payload.base64Content === "string") {
    return extractDocumentFromBinary({
      kind: payload.kind,
      fileName: payload.fileName ?? `${payload.kind}.bin`,
      contentType: payload.contentType ?? "application/octet-stream",
      bytes: Buffer.from(payload.base64Content, "base64"),
    });
  }

  throw new Error(
    "JSON uploads must include either rawText or base64Content.",
  );
};

const parseFormUpload = async (
  request: HttpRequest,
): Promise<ExtractDocumentResponse> => {
  const form = await request.formData();
  const kindValue = form.get("kind");
  const fileValue = form.get("file");

  if (typeof kindValue !== "string" || !isDocumentKind(kindValue)) {
    throw new Error("A valid document kind is required.");
  }

  if (!(fileValue instanceof File)) {
    throw new Error("A file upload is required.");
  }

  if (isTextLikeUpload(fileValue.name, fileValue.type)) {
    return extractDocumentFromText({
      kind: kindValue,
      fileName: fileValue.name,
      contentType: fileValue.type || "text/plain",
      rawText: await fileValue.text(),
    });
  }

  return extractDocumentFromBinary({
    kind: kindValue,
    fileName: fileValue.name,
    contentType: fileValue.type || "application/octet-stream",
    bytes: new Uint8Array(await fileValue.arrayBuffer()),
  });
};

export async function extractDocumentHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    const result = contentType.includes("application/json")
      ? await parseJsonUpload(request)
      : await parseFormUpload(request);

    return jsonResponse(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload parsing failed.";
    return badRequest(message);
  }
}

app.http("extractDocument", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "documents/extract",
  handler: extractDocumentHandler,
});
