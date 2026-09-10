import { describe, expect, it } from "vitest";
import { calcExpectedBalance } from "@/lib/cash-register";

describe("calcExpectedBalance", () => {
  it("sums opening plus sales and income minus expenses", () => {
    expect(calcExpectedBalance(1000, 500, 200, 100)).toBe(1600);
  });

  it("returns the opening amount when there is no movement", () => {
    expect(calcExpectedBalance(250, 0, 0, 0)).toBe(250);
  });

  it("handles a deficit", () => {
    expect(calcExpectedBalance(0, 100, 0, 300)).toBe(-200);
  });

  it("handles zero values", () => {
    expect(calcExpectedBalance(0, 0, 0, 0)).toBe(0);
  });
});