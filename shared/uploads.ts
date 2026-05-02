const textUploadPattern = /\.(txt|md|json|csv)$/i;

export const isTextLikeUpload = (fileName: string, contentType: string) =>
  contentType.startsWith("text/") || textUploadPattern.test(fileName);

export const buildFallbackBinaryText = (
  fileName: string,
  ocrModeLabel: string,
) => `FILE NAME: ${fileName}
OCR MODE: ${ocrModeLabel}
Hint: Configure Azure credentials to run OCR on image and PDF uploads.`;
