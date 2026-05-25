export default class BackendError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "BackendError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
