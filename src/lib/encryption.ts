import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

// PBKDF2 configuration for secure key derivation
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const PBKDF2_KEY_LENGTH = 32; // 256 bits for AES-256
const PBKDF2_DIGEST = "sha256";

// Static salt for key derivation (application-specific)
// This provides consistent key derivation from the same secret
// The salt doesn't need to be secret, it prevents rainbow table attacks
const PBKDF2_SALT = Buffer.from("fixit-cmms-encryption-salt-v1", "utf8");

// Cache the derived key to avoid repeated PBKDF2 computation
let cachedKey: Buffer | null = null;
let cachedSecret: string | null = null;

/**
 * Get encryption key from environment variable using PBKDF2 key derivation.
 * Key will be 32 bytes (256 bits) for AES-256.
 *
 * Uses PBKDF2 with SHA-256 and 100,000 iterations as recommended by OWASP.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error("APP_SECRET environment variable is not set");
  }

  // Return cached key if secret hasn't changed
  if (cachedKey && cachedSecret === secret) {
    return cachedKey;
  }

  // If the secret is hex-encoded (64 chars = 32 bytes), use it directly
  // This allows users to provide a pre-derived key for performance
  if (/^[a-f0-9]{64}$/i.test(secret)) {
    cachedKey = Buffer.from(secret, "hex");
    cachedSecret = secret;
    return cachedKey;
  }

  // Derive key using PBKDF2 for cryptographic strength
  // This handles any secret format (short passwords, passphrases, etc.)
  cachedKey = pbkdf2Sync(
    secret,
    PBKDF2_SALT,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST
  );
  cachedSecret = secret;
  return cachedKey;
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all base64 encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with AES-256-GCM.
 * Expects format: iv:authTag:ciphertext (all base64 encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivBase64, authTagBase64, ciphertext] = parts;
  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check if a string is encrypted (has the expected format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;

  try {
    const iv = Buffer.from(parts[0], "base64");
    const authTag = Buffer.from(parts[1], "base64");
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}
