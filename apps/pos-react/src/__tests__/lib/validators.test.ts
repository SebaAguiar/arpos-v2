import { describe, expect, it } from "vitest";
import { EMAIL_RE, isValidCuit, validatePasswordMatch } from "@/lib/validators";

describe("EMAIL_RE", () => {
  it.each([
    ["admin@arcom.com", true],
    ["a@b.co", true],
    ["sin-arroba.com", false],
    ["a@b", false],
    ["a b@c.com", false],
  ])("validates %s as %s", (email, expected) => {
    expect(EMAIL_RE.test(email)).toBe(expected);
  });
});

describe("isValidCuit", () => {
  it("accepts a valid CUIT", () => {
    expect(isValidCuit("20111111112")).toBe(true);
  });

  it("accepts a CUIT with formatting characters", () => {
    expect(isValidCuit("20-11111111-2")).toBe(true);
  });

  it("rejects an invalid check digit", () => {
    expect(isValidCuit("20111111113")).toBe(false);
  });

  it("rejects a too-short number", () => {
    expect(isValidCuit("20111111")).toBe(false);
  });
});

describe("validatePasswordMatch", () => {
  it("returns true when passwords match", () => {
    expect(validatePasswordMatch("secret123", "secret123")).toBe(true);
  });

  it("returns false when passwords differ", () => {
    expect(validatePasswordMatch("secret123", "secret124")).toBe(false);
  });
});