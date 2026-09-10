import { describe, expect, it } from "vitest";
import { formatDate, getPeriodTimestamps } from "@/lib/date";

describe("formatDate", () => {
  it("formats a unix timestamp as es-AR date with time", () => {
    const ts = new Date(2024, 0, 15, 9, 30).getTime() / 1000;
    expect(formatDate(ts)).toMatch(/^15\/01\/24, 09:30/);
  });
});

describe("getPeriodTimestamps", () => {
  it("today returns the start of the current day up to now", () => {
    const now = Math.floor(Date.now() / 1000);
    const { from, to } = getPeriodTimestamps("today");
    expect(from).toBeDefined();
    expect(to).toBe(now);
    expect(new Date((from ?? 0) * 1000).getHours()).toBe(0);
    expect(new Date((from ?? 0) * 1000).getMinutes()).toBe(0);
  });

  it("week returns a 7-day window", () => {
    const now = Math.floor(Date.now() / 1000);
    const { from, to } = getPeriodTimestamps("week");
    expect(to).toBe(now);
    expect(from).toBe(now - 7 * 86400);
  });

  it("month returns a 30-day window", () => {
    const now = Math.floor(Date.now() / 1000);
    const { from, to } = getPeriodTimestamps("month");
    expect(to).toBe(now);
    expect(from).toBe(now - 30 * 86400);
  });

  it("custom falls back to a 7-day window without a date", () => {
    const now = Math.floor(Date.now() / 1000);
    const { from, to } = getPeriodTimestamps("custom");
    expect(to).toBe(now);
    expect(from).toBe(now - 7 * 86400);
  });

  it("custom spans the full given day", () => {
    const { from, to } = getPeriodTimestamps("custom", "2025-03-10");
    expect(from).toBe(Math.floor(new Date(2025, 2, 10).getTime() / 1000));
    expect(to).toBe((from ?? 0) + 86400);
  });
});