import BackendError from "../lib/BackendError.js";

export function validateWriterPayload(fieldSchema, payload) {
  if (!payload || typeof payload !== "object") {
    throw new BackendError(422, "VALIDATION_ERROR", "Payload is required for writer submissions");
  }
  const schema = Array.isArray(fieldSchema) ? fieldSchema : [];
  for (const field of schema) {
    if (!field.required) continue;
    const value = payload[field.key];
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new BackendError(
        422,
        "VALIDATION_ERROR",
        `Missing required field: ${field.key}`
      );
    }
  }
}

export function validateDesignerSubmission({ externalUrl, payload }) {
  if (!externalUrl || String(externalUrl).trim() === "") {
    throw new BackendError(422, "VALIDATION_ERROR", "externalUrl is required for designer submissions");
  }
  if (payload && Object.keys(payload).length > 0) {
    throw new BackendError(422, "VALIDATION_ERROR", "Designers submit via externalUrl only");
  }
}

export function validateWriterSubmission({ externalUrl, payload }) {
  if (externalUrl) {
    throw new BackendError(422, "VALIDATION_ERROR", "Writers submit structured content, not externalUrl");
  }
}
