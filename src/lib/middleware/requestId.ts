import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare module "express-serve-static-core" {
  interface Request {
    id: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers["x-request-id"];
  const id = typeof incomingId === "string" && incomingId.length > 0 ? incomingId : randomUUID();

  req.id = id;
  res.setHeader("X-Request-ID", id);
  next();
}
