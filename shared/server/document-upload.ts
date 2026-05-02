export { createTraceDocument } from "../trace-document";
export { buildFallbackBinaryText, isTextLikeUpload } from "../uploads";
export { buildBinaryUploadResponse } from "./document-upload/binary-upload-response";
export { buildTextUploadResponse } from "./document-upload/text-upload-response";
export type {
  BinaryUploadResponseOptions,
  IntegrationStatusBuilder,
  TextUploadResponseOptions,
  TraceDocumentBuildOptions,
  TraceDocumentBuilder,
  UploadResponse,
} from "./document-upload/types";
