import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { decrypt } from "./encryption";

/**
 * SMTP configuration stored in system_settings
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  user: string;
  password: string; // encrypted
  fromAddress: string;
  fromName: string;
}

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const trimmed = email.trim();
    if (isValidEmail(trimmed)) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  }

  return { valid, invalid };
}

/**
 * Get SMTP configuration from database
 */
export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  const setting = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, "smtp_config"),
  });

  if (!setting || !setting.value) {
    return null;
  }

  return setting.value as SmtpConfig;
}

/**
 * Create a nodemailer transporter from SMTP config
 */
function createTransporter(
  config: SmtpConfig
): Transporter<SMTPTransport.SentMessageInfo> {
  const decryptedPassword = decrypt(config.password);

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: decryptedPassword,
    },
  });
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(
  config: SmtpConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Send an email using configured SMTP settings
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Get SMTP config from database
  const config = await getSmtpConfig();
  if (!config) {
    return { success: false, error: "SMTP is not configured" };
  }

  // Validate recipient emails
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const { valid, invalid } = validateEmails(recipients);

  if (invalid.length > 0) {
    return {
      success: false,
      error: `Invalid email addresses: ${invalid.join(", ")}`,
    };
  }

  if (valid.length === 0) {
    return { success: false, error: "No valid recipients" };
  }

  try {
    const transporter = createTransporter(config);

    const result = await transporter.sendMail({
      from: config.fromName
        ? `"${config.fromName}" <${config.fromAddress}>`
        : config.fromAddress,
      to: valid.join(", "),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    console.error("Email send error:", error);
    return { success: false, error: message };
  }
}

/**
 * Send email with retry logic for transient failures
 */
export async function sendEmailWithRetry(
  options: SendEmailOptions,
  maxRetries = 3,
  delayMs = 1000
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  attempts: number;
}> {
  let lastError: string | undefined;
  let attempts = 0;

  for (let i = 0; i < maxRetries; i++) {
    attempts++;
    const result = await sendEmail(options);

    if (result.success) {
      return { ...result, attempts };
    }

    lastError = result.error;

    // Don't retry for validation errors
    if (
      result.error?.includes("Invalid email") ||
      result.error?.includes("SMTP is not configured")
    ) {
      return { success: false, error: lastError, attempts };
    }

    // Wait before retry (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }

  return { success: false, error: lastError, attempts };
}
