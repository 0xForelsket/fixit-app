/**
 * Standardized API Error Handling
 *
 * Provides consistent error responses across all API routes with:
 * - Standardized response format
 * - Request ID correlation for debugging
 * - Proper HTTP status codes
 * - No implementation details leaked to clients
 */

import { NextResponse } from "next/server";
import { apiLogger, generateRequestId } from "./logger";

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  requestId: string;
  timestamp: string;
}

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T> {
  data: T;
  requestId?: string;
}

/**
 * HTTP Status codes for common error scenarios
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error codes for categorizing errors
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_EXISTS: "RESOURCE_EXISTS",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
} as const;

/**
 * Create a standardized API error response
 *
 * @param message - User-friendly error message (no implementation details!)
 * @param status - HTTP status code
 * @param options - Additional error options
 * @returns NextResponse with standardized error format
 */
export function apiError(
  message: string,
  status: number,
  options?: {
    code?: string;
    requestId?: string;
    logError?: unknown;
  }
): NextResponse<ApiErrorResponse> {
  const requestId = options?.requestId || generateRequestId();

  // Log the error server-side with full details
  if (options?.logError) {
    apiLogger.error(
      {
        requestId,
        status,
        code: options.code,
        error: options.logError,
      },
      message
    );
  }

  return NextResponse.json(
    {
      error: message,
      code: options?.code,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Pre-configured error responses for common scenarios
 */
export const ApiErrors = {
  /** User is not authenticated */
  unauthorized: (requestId?: string) =>
    apiError("Authentication required", HttpStatus.UNAUTHORIZED, {
      code: ErrorCode.AUTHENTICATION_REQUIRED,
      requestId,
    }),

  /** User lacks permission for this action */
  forbidden: (requestId?: string) =>
    apiError(
      "You don't have permission to perform this action",
      HttpStatus.FORBIDDEN,
      {
        code: ErrorCode.PERMISSION_DENIED,
        requestId,
      }
    ),

  /** Resource not found */
  notFound: (resource = "Resource", requestId?: string) =>
    apiError(`${resource} not found`, HttpStatus.NOT_FOUND, {
      code: ErrorCode.RESOURCE_NOT_FOUND,
      requestId,
    }),

  /** Validation error */
  validationError: (message = "Invalid input", requestId?: string) =>
    apiError(message, HttpStatus.BAD_REQUEST, {
      code: ErrorCode.VALIDATION_ERROR,
      requestId,
    }),

  /** Rate limited */
  rateLimited: (retryAfterSeconds: number, requestId?: string) => {
    const response = apiError(
      `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
      HttpStatus.TOO_MANY_REQUESTS,
      {
        code: ErrorCode.RATE_LIMITED,
        requestId,
      }
    );
    response.headers.set("Retry-After", String(retryAfterSeconds));
    return response;
  },

  /** Generic internal error - logs the actual error, returns safe message */
  internal: (error: unknown, requestId?: string) =>
    apiError(
      "An unexpected error occurred. Please try again later.",
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        code: ErrorCode.INTERNAL_ERROR,
        requestId,
        logError: error,
      }
    ),

  /** Bad request */
  badRequest: (message = "Bad request", requestId?: string) =>
    apiError(message, HttpStatus.BAD_REQUEST, {
      code: ErrorCode.BAD_REQUEST,
      requestId,
    }),

  /** Resource already exists */
  conflict: (message = "Resource already exists", requestId?: string) =>
    apiError(message, HttpStatus.CONFLICT, {
      code: ErrorCode.RESOURCE_EXISTS,
      requestId,
    }),
} as const;

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(
  data: T,
  status: number = HttpStatus.OK,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      ...(requestId && { requestId }),
    },
    { status }
  );
}
