import BackendError from "../../lib/BackendError.js";

export default function validate(schemaName, schema, requestProperty = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[requestProperty]);
    if (!result.success) {
      return next(
        new BackendError(
          422,
          "VALIDATION_ERROR",
          `invalid ${schemaName} data`,
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          }))
        )
      );
    }
    req.validated ??= {};
    req.validated[requestProperty] = result.data;
    next();
  };
}
