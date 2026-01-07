/**
 * Standardized API Error Handling
 *
 * Provides consistent error responses across all API routes with:
 * - Standardized response format
 * - Request ID correlation for debugging
 * - Proper HTTP status codes
 * - No implementation details leaked to clients
 * - Type-safe custom error classes
 */

import { NextResponse } from "next/server";
import { apiLogger, generateRequestId } from "./logger";

/**
 * Custom error classes for type-safe error handling
 * Use these instead of throwing errors with string messages
 */

/** Base class for API errors */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Thrown when user is not authenticated */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** Thrown when user lacks permission */
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/** Thrown when CSRF token is missing or invalid */
export class CsrfError extends ApiError {
  constructor(message = "CSRF token invalid") {
    super(message, "CSRF_ERROR");
    this.name = "CsrfError";
  }
}

/** Thrown when resource is not found */
export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/** Thrown when validation fails */
export class ValidationError extends ApiError {
  constructor(
    message = "Validation failed",
    public readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Helper to handle errors in API routes consistently
 * Converts custom error classes to appropriate API responses
 */
export function handleApiError(
  error: unknown,
  requestId: string,
  context?: string
): NextResponse {
  // Handle custom error types
  if (error instanceof UnauthorizedError) {
    return ApiErrors.unauthorized(requestId);
  }

  if (error instanceof ForbiddenError || error instanceof CsrfError) {
    return ApiErrors.forbidden(requestId);
  }

  if (error instanceof NotFoundError) {
    return ApiErrors.notFound(
      error.message.replace(" not found", ""),
      requestId
    );
  }

  if (error instanceof ValidationError) {
    return ApiErrors.validationError(error.message, requestId);
  }

  // Handle legacy string-based errors for backwards compatibility
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return ApiErrors.unauthorized(requestId);
    }
    if (error.message === "Forbidden") {
      return ApiErrors.forbidden(requestId);
    }
    if (
      error.message === "CSRF token missing" ||
      error.message === "CSRF token invalid"
    ) {
      return ApiErrors.forbidden(requestId);
    }
  }

  // Log and return generic error for unknown errors
  if (context) {
    apiLogger.error({ requestId, error }, context);
  }
  return ApiErrors.internal(error, requestId);
}

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
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API success response with pagination
 */
export interface ApiPaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: PaginationMeta;
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
 *
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @param requestId - Optional request ID for correlation
 * @param options - Optional response configuration (headers, etc.)
 */
export function apiSuccess<T>(
  data: T,
  status: number = HttpStatus.OK,
  requestId?: string,
  options?: { headers?: Record<string, string> }
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      data,
      ...(requestId && { requestId }),
    },
    {
      status,
      headers: options?.headers,
    }
  );
}

/**
 * Create a standardized paginated success response for list endpoints
 *
 * @param data - Array of items
 * @param pagination - Pagination metadata
 * @param options - Optional response configuration (headers, caching, etc.)
 */
export function apiSuccessPaginated<T>(
  data: T[],
  pagination: PaginationMeta,
  options?: {
    headers?: Record<string, string>;
    /** Cache duration in seconds for private (authenticated) endpoints */
    cacheDuration?: number;
  }
): NextResponse<ApiPaginatedResponse<T>> {
  const headers: Record<string, string> = { ...options?.headers };

  // Add private cache header if cacheDuration is specified
  // Using 'private' since these are authenticated endpoints
  if (options?.cacheDuration) {
    headers["Cache-Control"] =
      `private, max-age=${options.cacheDuration}, stale-while-revalidate=${Math.floor(options.cacheDuration / 2)}`;
  }

  return NextResponse.json(
    {
      data,
      pagination,
    },
    {
      status: HttpStatus.OK,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    }
  );
}
