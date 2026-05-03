export class ApiError extends Error {
  readonly statusCode: number;
  readonly headers?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.headers = headers;
  }
}
