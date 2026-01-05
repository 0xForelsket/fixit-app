import { beforeEach, describe, expect, it, mock } from "vitest";

// Mock the logger to avoid console noise in tests
const mockLoggerError = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerInfo = vi.fn();
const mockGenerateRequestId = vi.fn(() => "test-request-id");

vi.vi.fn("@/lib/logger", () => ({
  apiLogger: {
    error: mockLoggerError,
    warn: mockLoggerWarn,
    info: mockLoggerInfo,
  },
  generateRequestId: mockGenerateRequestId,
}));

const {
  ApiErrors,
  ErrorCode,
  HttpStatus,
  apiError,
  apiSuccess,
} = await import("@/lib/api-error");

describe("api-error", () => {
  beforeEach(() => {
    mockLoggerError.mockClear();
    mockLoggerWarn.mockClear();
    mockLoggerInfo.mockClear();
    mockGenerateRequestId.mockClear();
    mockGenerateRequestId.mockReturnValue("test-request-id");
  });

  describe("HttpStatus", () => {
    it("should have correct status codes", () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.NO_CONTENT).toBe(204);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.CONFLICT).toBe(409);
      expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
      expect(HttpStatus.TOO_MANY_REQUESTS).toBe(429);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503);
    });
  });

  describe("ErrorCode", () => {
    it("should have standard error codes", () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ErrorCode.AUTHENTICATION_REQUIRED).toBe("AUTHENTICATION_REQUIRED");
      expect(ErrorCode.PERMISSION_DENIED).toBe("PERMISSION_DENIED");
      expect(ErrorCode.RESOURCE_NOT_FOUND).toBe("RESOURCE_NOT_FOUND");
      expect(ErrorCode.RESOURCE_EXISTS).toBe("RESOURCE_EXISTS");
      expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
      expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
      expect(ErrorCode.BAD_REQUEST).toBe("BAD_REQUEST");
    });
  });

  describe("apiError", () => {
    it("should create error response with correct status", async () => {
      const response = apiError("Test error", 400);

      expect(response.status).toBe(400);
    });

    it("should include error message in body", async () => {
      const response = apiError("Something went wrong", 500);
      const body = await response.json();

      expect(body.error).toBe("Something went wrong");
    });

    it("should include timestamp", async () => {
      const response = apiError("Test error", 400);
      const body = await response.json();

      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).getTime()).not.toBeNaN();
    });

    it("should include requestId", async () => {
      const response = apiError("Test error", 400, {
        requestId: "custom-request-id",
      });
      const body = await response.json();

      expect(body.requestId).toBe("custom-request-id");
    });

    it("should include error code when provided", async () => {
      const response = apiError("Test error", 400, {
        code: ErrorCode.VALIDATION_ERROR,
      });
      const body = await response.json();

      expect(body.code).toBe("VALIDATION_ERROR");
    });

    it("should generate requestId if not provided", async () => {
      const response = apiError("Test error", 400);
      const body = await response.json();

      expect(body.requestId).toBe("test-request-id");
    });
  });

  describe("apiSuccess", () => {
    it("should create success response with data", async () => {
      const data = { id: "1", displayId: 1, name: "Test" };
      const response = apiSuccess(data);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(data);
    });

    it("should use custom status code", async () => {
      const response = apiSuccess({ created: true }, HttpStatus.CREATED);

      expect(response.status).toBe(201);
    });

    it("should include requestId when provided", async () => {
      const response = apiSuccess({ ok: true }, 200, "my-request-id");
      const body = await response.json();

      expect(body.requestId).toBe("my-request-id");
    });

    it("should handle array data", async () => {
      const data = [{ id: "1", displayId: 1 }, { id: "2", displayId: 2 }];
      const response = apiSuccess(data);
      const body = await response.json();

      expect(body.data).toHaveLength(2);
      expect(body.data[0].id).toBe("1");
    });

    it("should handle null data", async () => {
      const response = apiSuccess(null);
      const body = await response.json();

      expect(body.data).toBeNull();
    });
  });

  describe("ApiErrors helpers", () => {
    describe("unauthorized", () => {
      it("should return 401 with correct message", async () => {
        const response = ApiErrors.unauthorized();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error).toBe("Authentication required");
        expect(body.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
      });
    });

    describe("forbidden", () => {
      it("should return 403 with correct message", async () => {
        const response = ApiErrors.forbidden();
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error).toBe(
          "You don't have permission to perform this action"
        );
        expect(body.code).toBe(ErrorCode.PERMISSION_DENIED);
      });
    });

    describe("notFound", () => {
      it("should return 404 with default message", async () => {
        const response = ApiErrors.notFound();
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error).toBe("Resource not found");
        expect(body.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      });

      it("should use custom resource name", async () => {
        const response = ApiErrors.notFound("Equipment");
        const body = await response.json();

        expect(body.error).toBe("Equipment not found");
      });
    });

    describe("validationError", () => {
      it("should return 400 with default message", async () => {
        const response = ApiErrors.validationError();
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid input");
        expect(body.code).toBe(ErrorCode.VALIDATION_ERROR);
      });

      it("should use custom message", async () => {
        const response = ApiErrors.validationError("Email is required");
        const body = await response.json();

        expect(body.error).toBe("Email is required");
      });
    });

    describe("rateLimited", () => {
      it("should return 429 with retry-after header", async () => {
        const response = ApiErrors.rateLimited(60);
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body.error).toContain("60 seconds");
        expect(body.code).toBe(ErrorCode.RATE_LIMITED);
        expect(response.headers.get("Retry-After")).toBe("60");
      });
    });

    describe("internal", () => {
      it("should return 500 with generic message", async () => {
        const response = ApiErrors.internal(
          new Error("Database connection failed")
        );
        const body = await response.json();

        expect(response.status).toBe(500);
        expect(body.error).toBe(
          "An unexpected error occurred. Please try again later."
        );
        expect(body.code).toBe(ErrorCode.INTERNAL_ERROR);
        // Should NOT leak the actual error message
        expect(body.error).not.toContain("Database");
      });
    });

    describe("badRequest", () => {
      it("should return 400 with message", async () => {
        const response = ApiErrors.badRequest("Invalid JSON");
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBe("Invalid JSON");
        expect(body.code).toBe(ErrorCode.BAD_REQUEST);
      });
    });

    describe("conflict", () => {
      it("should return 409 with message", async () => {
        const response = ApiErrors.conflict("User already exists");
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error).toBe("User already exists");
        expect(body.code).toBe(ErrorCode.RESOURCE_EXISTS);
      });
    });
  });
});
