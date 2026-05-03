import path from "node:path";
import multer from "multer";
import { ApiError } from "./api-error";
import { getRuntimeConfig } from "./runtime-config-service";

const getSafeExtension = (fileName: string) =>
  path.extname(path.basename(fileName)).trim().toLowerCase();

export const sanitizeUploadFileName = (fileName: string) =>
  path
    .basename(fileName)
    .replace(/[^\w.\- ]+/g, "_")
    .slice(0, 120);

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_request, file, callback) => {
    const config = getRuntimeConfig();
    const mimeType = file.mimetype.trim().toLowerCase();
    const extension = getSafeExtension(file.originalname);

    if (!config.allowedUploadMimeTypes.includes(mimeType)) {
      callback(
        new ApiError(
          415,
          `Unsupported upload MIME type: ${mimeType || "unknown"}.`,
        ),
      );
      return;
    }

    if (!config.allowedUploadExtensions.includes(extension)) {
      callback(
        new ApiError(
          415,
          `Unsupported upload file extension: ${extension || "unknown"}.`,
        ),
      );
      return;
    }

    callback(null, true);
  },
  limits: {
    fileSize: getRuntimeConfig().maxUploadFileSizeBytes,
    files: 1,
    fields: 1,
    fieldNameSize: 64,
    fieldSize: 128,
    parts: 4,
  },
});
