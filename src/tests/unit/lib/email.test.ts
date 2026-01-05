import { isValidEmail, validateEmails } from "@/lib/email";
import { describe, expect, it } from "vitest";

describe("isValidEmail", () => {
  it("should return true for valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.org")).toBe(true);
    expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });

  it("should return false for invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("test")).toBe(false);
    expect(isValidEmail("test@")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("test@example")).toBe(false);
    expect(isValidEmail("test example@domain.com")).toBe(false);
    expect(isValidEmail("test@@example.com")).toBe(false);
  });

  it("should return false for emails with spaces", () => {
    expect(isValidEmail(" test@example.com")).toBe(false);
    expect(isValidEmail("test@example.com ")).toBe(false);
    expect(isValidEmail("test @example.com")).toBe(false);
  });
});

describe("validateEmails", () => {
  it("should separate valid and invalid emails", () => {
    const result = validateEmails([
      "valid@example.com",
      "invalid",
      "also.valid@domain.org",
      "@bad.com",
    ]);

    expect(result.valid).toEqual([
      "valid@example.com",
      "also.valid@domain.org",
    ]);
    expect(result.invalid).toEqual(["invalid", "@bad.com"]);
  });

  it("should trim whitespace from emails", () => {
    const result = validateEmails([
      "  test@example.com  ",
      "  user@domain.org",
    ]);

    expect(result.valid).toEqual(["test@example.com", "user@domain.org"]);
    expect(result.invalid).toEqual([]);
  });

  it("should handle empty array", () => {
    const result = validateEmails([]);
    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it("should handle all valid emails", () => {
    const result = validateEmails(["a@b.com", "c@d.org", "e@f.net"]);

    expect(result.valid.length).toBe(3);
    expect(result.invalid.length).toBe(0);
  });

  it("should handle all invalid emails", () => {
    const result = validateEmails([
      "not-an-email",
      "@missing-local",
      "missing-domain@",
    ]);

    expect(result.valid.length).toBe(0);
    expect(result.invalid.length).toBe(3);
  });
});
