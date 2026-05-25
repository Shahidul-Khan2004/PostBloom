import BackendError from "../../lib/BackendError.js";

export function notFound(req, res, next) {
  next(new BackendError(404, "NOT_FOUND", `Route ${req.method} ${req.path} not found`));
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof BackendError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  if (err.code === "23505") {
    return res.status(409).json({
      error: { code: "DUPLICATE", message: "Resource already exists" },
    });
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
