import { Response } from "express";

export interface SuccessResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: object;
  };
}

export function successResponse<T>(res: Response, statusCode: number, message: string, data: T) {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
  });
}

export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    statusCode,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  });
}
