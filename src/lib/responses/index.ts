export interface SuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorResponse {
  success: false;
  data: null;
  error: ErrorPayload;
}

export function successResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data, error: null };
}

export function errorResponse(code: string, message: string, details?: unknown): ErrorResponse {
  return {
    success: false,
    data: null,
    error: details === undefined ? { code, message } : { code, message, details },
  };
}
