import { describe, expect, it } from "vitest";
import { formatCents } from "@/lib/currency";

describe("formatCents", () => {
  it("formats cents as es-AR pesos with two decimals", () => {
    expect(formatCents(1173700)).toBe("$11.737,00");
    expect(formatCents(1234)).toBe("$12,34");
    expect(formatCents(1)).toBe("$0,01");
  });

  it("handles zero", () => {
    expect(formatCents(0)).toBe("$0,00");
  });

  it("handles negative amounts", () => {
    expect(formatCents(-500)).toBe("$-5,00");
  });
});