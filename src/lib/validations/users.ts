import { z } from "zod";

export const userRoleSchema = z.enum(["operator", "tech", "admin"]);

export const loginSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID is too long"),
  pin: z
    .string()
    .min(4, "PIN must be at least 4 characters")
    .max(20, "PIN is too long"),
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
  pin: z
    .string()
    .min(4, "PIN must be at least 4 characters")
    .max(20, "PIN is too long"),
  role: userRoleSchema.default("operator"),
  isActive: z.boolean().default(true),
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
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const updatePinSchema = z.object({
  pin: z
    .string()
    .min(4, "PIN must be at least 4 characters")
    .max(20, "PIN is too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePinInput = z.infer<typeof updatePinSchema>;
