import { z } from "zod";

export const userRoleSchema = z.enum(["operator", "tech", "admin"]);

// PIN must be 6-20 digits only (6 digits = 1,000,000 combinations for brute-force protection)
const pinSchema = z
  .string()
  .min(6, "PIN must be at least 6 digits")
  .max(20, "PIN is too long")
  .regex(/^\d+$/, "PIN must contain only digits");

export const loginSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID is too long"),
  pin: pinSchema,
});

export const createUserSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID is too long")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "Employee ID can only contain letters, numbers, and hyphens"
    ),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  pin: pinSchema,
  role: userRoleSchema.default("operator"),
  roleId: z.string().min(1, "Role is required").optional(),
  isActive: z.boolean().default(true),
  hourlyRate: z.coerce
    .number()
    .min(0, "Hourly rate must be positive")
    .optional()
    .nullable(),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  pin: pinSchema.optional().or(z.literal("")),
  role: userRoleSchema.optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  hourlyRate: z.coerce
    .number()
    .min(0, "Hourly rate must be positive")
    .optional()
    .nullable(),
});

export const updatePinSchema = z.object({
  pin: pinSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
