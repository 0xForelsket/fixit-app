"use server";
import { authenticateUser } from "@/lib/services/auth.service";
import { deleteSession } from "@/lib/session";
import { loginSchema } from "@/lib/validations";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
  success?: boolean;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawData = {
    employeeId: formData.get("employeeId"),
    pin: formData.get("pin"),
  };

  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    return { error: "Invalid employee ID or PIN format" };
  }

  const { employeeId, pin } = result.data;

  const authResult = await authenticateUser(employeeId, pin);

  if (!authResult.success) {
    return { error: authResult.error };
  }

  // Redirect to /dashboard. Middleware will handle:
  // 1. Root domain -> App subdomain redirect
  // 2. App subdomain -> Admin check -> Analytics redirect
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
