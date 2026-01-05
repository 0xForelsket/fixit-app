import {
  createEquipmentSchema,
  createLocationSchema,
  createUserSchema,
  createWorkOrderSchema,
  loginSchema,
  updateWorkOrderSchema,
} from "@/lib/validations";
import {
  downtimeLogSchema,
  meterReadingSchema,
  meterSchema,
} from "@/lib/validations/equipment";
import { describe, expect, it } from "vitest";

describe("loginSchema", () => {
  it("should validate correct login credentials", () => {
    const result = loginSchema.safeParse({
      employeeId: "TECH-001",
      pin: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty employee ID", () => {
    const result = loginSchema.safeParse({
      employeeId: "",
      pin: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should reject PIN shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      employeeId: "TECH-001",
      pin: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("should accept PIN with 6 characters", () => {
    const result = loginSchema.safeParse({
      employeeId: "TECH-001",
      pin: "123456",
    });
    expect(result.success).toBe(true);
  });
});

describe("createUserSchema", () => {
  it("should validate correct user data", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP-001",
      name: "John Smith",
      email: "john@example.com",
      pin: "123456",
      role: "operator",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid employee ID format", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP 001", // space not allowed
      name: "John Smith",
      pin: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("should allow employee ID with hyphens", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP-001-A",
      name: "John Smith",
      pin: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("should default role to operator", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP-001",
      name: "John Smith",
      pin: "123456",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.role).toBe("operator");
    }
  });

  it("should accept valid roles", () => {
    for (const role of ["operator", "tech", "admin"]) {
      const result = createUserSchema.safeParse({
        employeeId: "EMP-001",
        name: "John Smith",
        pin: "123456",
        role,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid roles", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP-001",
      name: "John Smith",
      pin: "123456",
      role: "superadmin",
    });
    expect(result.success).toBe(false);
  });

  it("should allow null email", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP-001",
      name: "John Smith",
      pin: "123456",
      email: null,
    });
    expect(result.success).toBe(true);
  });

  it("should allow empty string email", () => {
    const result = createUserSchema.safeParse({
      employeeId: "EMP-001",
      name: "John Smith",
      pin: "123456",
      email: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("createLocationSchema", () => {
  it("should validate correct location data", () => {
    const result = createLocationSchema.safeParse({
      name: "Hall A",
      code: "HALL-A",
    });
    expect(result.success).toBe(true);
  });

  it("should require uppercase code", () => {
    const result = createLocationSchema.safeParse({
      name: "Hall A",
      code: "hall-a", // lowercase
    });
    expect(result.success).toBe(false);
  });

  it("should accept code with numbers", () => {
    const result = createLocationSchema.safeParse({
      name: "Assembly Line 1",
      code: "AL-01",
    });
    expect(result.success).toBe(true);
  });

  it("should allow optional parent ID", () => {
    const result = createLocationSchema.safeParse({
      name: "Sub Area",
      code: "SUB-01",
      parentId: "1",
    });
    expect(result.success).toBe(true);
  });
});

describe("createEquipmentSchema", () => {
  it("should validate correct equipment data", () => {
    const result = createEquipmentSchema.safeParse({
      name: "Injection Molder A",
      code: "IM-001",
      locationId: "1",
      departmentId: "1",
    });
    expect(result.success).toBe(true);
  });

  it("should require location ID", () => {
    const result = createEquipmentSchema.safeParse({
      name: "Injection Molder A",
      code: "IM-001",
      departmentId: "1",
    });
    expect(result.success).toBe(false);
  });

  it("should require department ID", () => {
    const result = createEquipmentSchema.safeParse({
      name: "Injection Molder A",
      code: "IM-001",
      locationId: "1",
    });
    expect(result.success).toBe(false);
  });

  it("should default status to operational", () => {
    const result = createEquipmentSchema.safeParse({
      name: "Injection Molder A",
      code: "IM-001",
      locationId: "1",
      departmentId: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("operational");
    }
  });

  it("should accept valid statuses", () => {
    for (const status of ["operational", "down", "maintenance"]) {
      const result = createEquipmentSchema.safeParse({
        name: "Equipment",
        code: "M-001",
        locationId: "1",
        departmentId: "1",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should allow optional owner ID", () => {
    const result = createEquipmentSchema.safeParse({
      name: "Equipment",
      code: "M-001",
      locationId: "1",
      departmentId: "1",
      ownerId: "5",
    });
    expect(result.success).toBe(true);
  });
});

describe("createWorkOrderSchema", () => {
  it("should validate correct work order data", () => {
    const result = createWorkOrderSchema.safeParse({
      equipmentId: "1",
      type: "breakdown",
      title: "Equipment not working",
      description: "The equipment stopped working after the power outage.",
    });
    expect(result.success).toBe(true);
  });

  it("should require all fields", () => {
    const result = createWorkOrderSchema.safeParse({
      equipmentId: "1",
      type: "breakdown",
      title: "Equipment not working",
      // missing description
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid work order types", () => {
    const types = [
      "breakdown",
      "maintenance",
      "calibration",
      "safety",
      "upgrade",
    ];
    for (const type of types) {
      const result = createWorkOrderSchema.safeParse({
        equipmentId: "1",
        type,
        title: "Test work order",
        description: "Test description",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should default priority to medium", () => {
    const result = createWorkOrderSchema.safeParse({
      equipmentId: "1",
      type: "breakdown",
      title: "Test",
      description: "Test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("medium");
    }
  });

  it("should accept valid priorities", () => {
    const priorities = ["low", "medium", "high", "critical"];
    for (const priority of priorities) {
      const result = createWorkOrderSchema.safeParse({
        equipmentId: "1",
        type: "breakdown",
        title: "Test",
        description: "Test",
        priority,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject title over 200 characters", () => {
    const result = createWorkOrderSchema.safeParse({
      equipmentId: "1",
      type: "breakdown",
      title: "A".repeat(201),
      description: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateWorkOrderSchema", () => {
  it("should allow partial updates", () => {
    const result = updateWorkOrderSchema.safeParse({
      status: "in_progress",
    });
    expect(result.success).toBe(true);
  });

  it("should validate status values", () => {
    const result = updateWorkOrderSchema.safeParse({
      status: "invalid_status",
    });
    expect(result.success).toBe(false);
  });

  it("should allow null assignedToId for unassignment", () => {
    const result = updateWorkOrderSchema.safeParse({
      assignedToId: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept resolution notes", () => {
    const result = updateWorkOrderSchema.safeParse({
      status: "resolved",
      resolutionNotes: "Fixed by replacing the motor.",
    });
    expect(result.success).toBe(true);
  });
});

describe("meterSchema", () => {
  it("should validate correct meter data", () => {
    const result = meterSchema.safeParse({
      name: "Odometer",
      type: "hours",
      unit: "km",
    });
    expect(result.success).toBe(true);
  });

  it("should require name", () => {
    const result = meterSchema.safeParse({
      name: "",
      type: "hours",
      unit: "km",
    });
    expect(result.success).toBe(false);
  });

  it("should require unit", () => {
    const result = meterSchema.safeParse({
      name: "Odometer",
      type: "hours",
      unit: "",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional currentReading", () => {
    const result = meterSchema.safeParse({
      name: "Odometer",
      type: "hours",
      unit: "km",
      currentReading: 12500,
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative currentReading", () => {
    const result = meterSchema.safeParse({
      name: "Odometer",
      type: "hours",
      unit: "km",
      currentReading: -100,
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid meter types", () => {
    for (const type of ["hours", "miles", "kilometers", "cycles", "units"]) {
      const result = meterSchema.safeParse({
        name: "Test Meter",
        type,
        unit: "units",
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("meterReadingSchema", () => {
  it("should validate correct reading data", () => {
    const result = meterReadingSchema.safeParse({
      meterId: "meter-123",
      reading: 15000,
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional notes", () => {
    const result = meterReadingSchema.safeParse({
      meterId: "meter-123",
      reading: 15000,
      notes: "Regular reading",
    });
    expect(result.success).toBe(true);
  });

  it("should require meterId", () => {
    const result = meterReadingSchema.safeParse({
      meterId: "",
      reading: 15000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative reading", () => {
    const result = meterReadingSchema.safeParse({
      meterId: "meter-123",
      reading: -500,
    });
    expect(result.success).toBe(false);
  });

  it("should reject notes over 500 characters", () => {
    const result = meterReadingSchema.safeParse({
      meterId: "meter-123",
      reading: 15000,
      notes: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe("downtimeLogSchema", () => {
  it("should validate correct downtime data", () => {
    const result = downtimeLogSchema.safeParse({
      equipmentId: "equip-123",
      startTime: new Date(),
      reasonCode: "mechanical_failure",
    });
    expect(result.success).toBe(true);
  });

  it("should allow null endTime for ongoing downtime", () => {
    const result = downtimeLogSchema.safeParse({
      equipmentId: "equip-123",
      startTime: new Date(),
      endTime: null,
      reasonCode: "no_operator",
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid reason codes", () => {
    const reasonCodes = [
      "mechanical_failure",
      "electrical_failure",
      "no_operator",
      "no_materials",
      "planned_maintenance",
      "changeover",
      "other",
    ];
    for (const reasonCode of reasonCodes) {
      const result = downtimeLogSchema.safeParse({
        equipmentId: "equip-123",
        startTime: new Date(),
        reasonCode,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject invalid reason code", () => {
    const result = downtimeLogSchema.safeParse({
      equipmentId: "equip-123",
      startTime: new Date(),
      reasonCode: "invalid_reason",
    });
    expect(result.success).toBe(false);
  });

  it("should accept optional notes", () => {
    const result = downtimeLogSchema.safeParse({
      equipmentId: "equip-123",
      startTime: new Date(),
      reasonCode: "other",
      notes: "Waiting for spare parts",
    });
    expect(result.success).toBe(true);
  });

  it("should reject notes over 1000 characters", () => {
    const result = downtimeLogSchema.safeParse({
      equipmentId: "equip-123",
      startTime: new Date(),
      reasonCode: "other",
      notes: "A".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
