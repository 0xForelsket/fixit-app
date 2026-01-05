import { decrypt, encrypt, isEncrypted } from "@/lib/encryption";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Store original env value
const originalAppSecret = process.env.APP_SECRET;

describe("encryption", () => {
  beforeAll(() => {
    // Set a test secret (32 bytes hex = 64 chars)
    process.env.APP_SECRET =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  afterAll(() => {
    // Restore original env
    process.env.APP_SECRET = originalAppSecret;
  });

  describe("encrypt/decrypt round-trip", () => {
    it("should encrypt and decrypt a simple string", () => {
      const plaintext = "hello world";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt an empty string", () => {
      const plaintext = "";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt special characters", () => {
      const plaintext = "p@$$w0rd!@#$%^&*()_+{}|:<>?";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt unicode characters", () => {
      const plaintext = "Hello 世界 🌍 مرحبا";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt and decrypt long strings", () => {
      const plaintext = "a".repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertext for same plaintext (due to random IV)", () => {
      const plaintext = "test";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
      // But both should decrypt to same plaintext
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });
  });

  describe("encrypted format", () => {
    it("should produce correct format (iv:authTag:ciphertext)", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      expect(parts.length).toBe(3);
    });

    it("should have valid base64 parts", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");

      // Each part should be valid base64
      for (const part of parts) {
        expect(() => Buffer.from(part, "base64")).not.toThrow();
      }
    });
  });

  describe("isEncrypted", () => {
    it("should return true for encrypted strings", () => {
      const encrypted = encrypt("test");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for plain strings", () => {
      expect(isEncrypted("plain text")).toBe(false);
    });

    it("should return false for partially formatted strings", () => {
      expect(isEncrypted("abc:def")).toBe(false);
      expect(isEncrypted("abc:def:ghi:jkl")).toBe(false);
    });

    it("should return false for invalid base64", () => {
      expect(isEncrypted("!!!:???:---")).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should throw on invalid encrypted format", () => {
      expect(() => decrypt("invalid")).toThrow("Invalid encrypted data format");
    });

    it("should throw on tampered ciphertext (GCM auth check)", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      // Tamper with the ciphertext
      parts[2] = Buffer.from("tampered").toString("base64");
      const tampered = parts.join(":");

      expect(() => decrypt(tampered)).toThrow();
    });

    it("should throw on tampered auth tag", () => {
      const encrypted = encrypt("test");
      const parts = encrypted.split(":");
      // Tamper with the auth tag
      parts[1] = Buffer.from("0".repeat(16)).toString("base64");
      const tampered = parts.join(":");

      expect(() => decrypt(tampered)).toThrow();
    });
  });
});

describe("encryption without APP_SECRET", () => {
  it("should throw when APP_SECRET is not set", () => {
    const original = process.env.APP_SECRET;
    delete process.env.APP_SECRET;

    expect(() => encrypt("test")).toThrow(
      "APP_SECRET environment variable is not set"
    );

    process.env.APP_SECRET = original;
  });
});
