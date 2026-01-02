"use server";

import { db } from "@/db";
import { type SmtpConfig, systemSettings } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { PERMISSIONS, userHasPermission } from "@/lib/auth";
import { testSmtpConnection } from "@/lib/email";
import { encrypt } from "@/lib/encryption";
import { getCurrentUser } from "@/lib/session";
import type { ActionResult } from "@/lib/types/actions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Get SMTP configuration (password is masked)
 */
export async function getSmtpSettings(): Promise<
  ActionResult<Omit<SmtpConfig, "password"> & { hasPassword: boolean }>
> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
    return {
      success: false,
      error: "You don't have permission to view settings",
    };
  }

  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "smtp_config"),
  });

  if (!setting || !setting.value) {
    return {
      success: true,
      data: {
        host: "",
        port: 587,
        secure: false,
        user: "",
        fromAddress: "",
        fromName: "",
        hasPassword: false,
      },
    };
  }

  const config = setting.value as SmtpConfig;

  // Never return the actual password to the client
  return {
    success: true,
    data: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      fromAddress: config.fromAddress,
      fromName: config.fromName,
      hasPassword: Boolean(config.password),
    },
  };
}

/**
 * Save SMTP configuration
 */
export async function saveSmtpSettings(
  formData: FormData
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
    return {
      success: false,
      error: "You don't have permission to update settings",
    };
  }

  const host = formData.get("host")?.toString().trim();
  const portStr = formData.get("port")?.toString();
  const secure = formData.get("secure") === "true";
  const smtpUser = formData.get("user")?.toString().trim();
  const password = formData.get("password")?.toString();
  const fromAddress = formData.get("fromAddress")?.toString().trim();
  const fromName = formData.get("fromName")?.toString().trim() || "";

  // Validation
  if (!host) {
    return { success: false, error: "SMTP host is required" };
  }

  const port = portStr ? Number.parseInt(portStr, 10) : 587;
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return { success: false, error: "Invalid port number" };
  }

  if (!smtpUser) {
    return { success: false, error: "SMTP username is required" };
  }

  if (!fromAddress) {
    return { success: false, error: "From address is required" };
  }

  // Get existing config to preserve password if not updating
  const existingSetting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "smtp_config"),
  });

  let encryptedPassword: string;

  if (password) {
    // New password provided, encrypt it
    encryptedPassword = encrypt(password);
  } else if (existingSetting?.value) {
    // Keep existing password
    const existingConfig = existingSetting.value as SmtpConfig;
    if (!existingConfig.password) {
      return { success: false, error: "Password is required" };
    }
    encryptedPassword = existingConfig.password;
  } else {
    return { success: false, error: "Password is required" };
  }

  const config: SmtpConfig = {
    host,
    port,
    secure,
    user: smtpUser,
    password: encryptedPassword,
    fromAddress,
    fromName,
  };

  try {
    await db
      .insert(systemSettings)
      .values({
        key: "smtp_config",
        value: config,
        updatedById: user.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value: config,
          updatedById: user.id,
          updatedAt: new Date(),
        },
      });

    await logAudit({
      entityType: "user",
      entityId: "smtp_config",
      action: "UPDATE",
      details: {
        settingKey: "smtp_config",
        host,
        port,
        fromAddress,
      },
    });

    revalidatePath("/admin/settings/email");
    return { success: true };
  } catch (error) {
    console.error("Failed to save SMTP settings:", error);
    return { success: false, error: "Failed to save settings" };
  }
}

/**
 * Test SMTP connection with current or provided settings
 */
export async function testSmtpSettings(
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
    return {
      success: false,
      error: "You don't have permission to test settings",
    };
  }

  const host = formData.get("host")?.toString().trim();
  const portStr = formData.get("port")?.toString();
  const secure = formData.get("secure") === "true";
  const smtpUser = formData.get("user")?.toString().trim();
  const password = formData.get("password")?.toString();
  const fromAddress = formData.get("fromAddress")?.toString().trim();
  const fromName = formData.get("fromName")?.toString().trim() || "";

  if (!host || !smtpUser || !fromAddress) {
    return { success: false, error: "Please fill in all required fields" };
  }

  const port = portStr ? Number.parseInt(portStr, 10) : 587;

  let testPassword: string;

  if (password) {
    // Use provided password (encrypt for consistency with testSmtpConnection)
    testPassword = encrypt(password);
  } else {
    // Try to use existing password
    const existingSetting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "smtp_config"),
    });

    if (!existingSetting?.value) {
      return { success: false, error: "Password is required for testing" };
    }

    const existingConfig = existingSetting.value as SmtpConfig;
    if (!existingConfig.password) {
      return { success: false, error: "Password is required for testing" };
    }
    testPassword = existingConfig.password;
  }

  const config: SmtpConfig = {
    host,
    port,
    secure,
    user: smtpUser,
    password: testPassword,
    fromAddress,
    fromName,
  };

  const result = await testSmtpConnection(config);

  if (result.success) {
    return { success: true, data: { message: "Connection successful!" } };
  }

  return { success: false, error: result.error || "Connection failed" };
}

/**
 * Send a test email
 */
export async function sendTestEmail(
  recipientEmail: string
): Promise<ActionResult<{ message: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "You must be logged in" };
  }

  if (!userHasPermission(user, PERMISSIONS.SYSTEM_SETTINGS)) {
    return {
      success: false,
      error: "You don't have permission to send test emails",
    };
  }

  // Import sendEmail dynamically to avoid circular dependency
  const { sendEmail, isValidEmail } = await import("@/lib/email");

  if (!isValidEmail(recipientEmail)) {
    return { success: false, error: "Invalid email address" };
  }

  const result = await sendEmail({
    to: recipientEmail,
    subject: "FixIt CMMS - Test Email",
    text: "This is a test email from FixIt CMMS. If you received this, your email configuration is working correctly!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">FixIt CMMS - Test Email</h2>
        <p>This is a test email from FixIt CMMS.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">
          Sent at ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  });

  if (result.success) {
    return {
      success: true,
      data: { message: `Test email sent to ${recipientEmail}` },
    };
  }

  return { success: false, error: result.error || "Failed to send test email" };
}
