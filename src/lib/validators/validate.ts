import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

interface RequestSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: RequestSchemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    // req.query has no setter in Express 5, so the parsed result is merged
    // into the existing object rather than assigned.
    if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    next();
  };
}
