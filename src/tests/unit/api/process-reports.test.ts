import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSystemSettingsFindFirst = vi.fn();
const mockReportTemplatesFindFirst = vi.fn();
const mockInsertValues = vi.fn();
const mockInsertOnConflictDoUpdate = vi.fn();
const mockInsert = vi.fn(() => ({
  values: mockInsertValues.mockReturnValue({
    onConflictDoUpdate: mockInsertOnConflictDoUpdate,
  }),
}));
const mockDeleteWhere = vi.fn();
const mockDelete = vi.fn(() => ({
  where: mockDeleteWhere,
}));

const mockGetDueSchedules = vi.fn();
const mockMarkScheduleRun = vi.fn();
const mockSendEmailWithRetry = vi.fn();
const mockApiLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
const mockGenerateRequestId = vi.fn(() => "req_test");

let lockHeld = false;

vi.mock("@/db", () => ({
  db: {
    query: {
      systemSettings: {
        findFirst: mockSystemSettingsFindFirst,
      },
      reportTemplates: {
        findFirst: mockReportTemplatesFindFirst,
      },
    },
    insert: mockInsert,
    delete: mockDelete,
  },
}));

vi.mock("@/actions/report-schedules", () => ({
  getDueSchedules: mockGetDueSchedules,
  markScheduleRun: mockMarkScheduleRun,
}));

vi.mock("@/lib/email", () => ({
  sendEmailWithRetry: mockSendEmailWithRetry,
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: mockApiLogger,
  generateRequestId: mockGenerateRequestId,
}));

const { GET } = await import("@/app/api/cron/process-reports/route");

describe("GET /api/cron/process-reports", () => {
  beforeEach(() => {
    lockHeld = false;

    mockSystemSettingsFindFirst.mockReset();
    mockReportTemplatesFindFirst.mockReset();
    mockInsertValues.mockReset();
    mockInsertOnConflictDoUpdate.mockReset();
    mockInsert.mockReset();
    mockDeleteWhere.mockReset();
    mockDelete.mockReset();
    mockGetDueSchedules.mockReset();
    mockMarkScheduleRun.mockReset();
    mockSendEmailWithRetry.mockReset();
    mockApiLogger.info.mockReset();
    mockApiLogger.warn.mockReset();
    mockApiLogger.error.mockReset();
    mockGenerateRequestId.mockReset();

    process.env.CRON_SECRET = "test-secret";

    mockSystemSettingsFindFirst.mockImplementation(async () => {
      if (!lockHeld) {
        return undefined;
      }

      return {
        key: "cron_process_reports_lock",
        value: {
          lockedAt: new Date().toISOString(),
        },
      };
    });

    mockInsert.mockReturnValue({
      values: mockInsertValues.mockReturnValue({
        onConflictDoUpdate: vi.fn(async () => {
          lockHeld = true;
        }),
      }),
    });

    mockDelete.mockReturnValue({
      where: vi.fn(async () => {
        lockHeld = false;
      }),
    });
  });

  it("releases the lock after a processing failure so the next run is not blocked", async () => {
    mockGetDueSchedules.mockRejectedValueOnce(new Error("boom"));
    mockGetDueSchedules.mockResolvedValueOnce([]);

    const firstRequest = new Request(
      "http://localhost/api/cron/process-reports",
      {
        headers: {
          "x-cron-secret": "test-secret",
        },
      }
    );
    const firstResponse = await GET(firstRequest);

    expect(firstResponse.status).toBe(500);
    expect(lockHeld).toBe(false);

    const secondRequest = new Request(
      "http://localhost/api/cron/process-reports",
      {
        headers: {
          "x-cron-secret": "test-secret",
        },
      }
    );
    const secondResponse = await GET(secondRequest);
    const secondBody = await secondResponse.json();

    expect(secondResponse.status).toBe(200);
    expect(secondBody.message).toBe("No schedules due");
    expect(lockHeld).toBe(false);
  });
});
