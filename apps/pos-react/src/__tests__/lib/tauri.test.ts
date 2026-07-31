import { describe, expect, it } from "vitest";
import { isTauri } from "@/lib/tauri";

describe("tauri detection", () => {
  it("detects a non-Tauri environment (jsdom/browser)", () => {
    expect(isTauri()).toBe(false);
  });
});
