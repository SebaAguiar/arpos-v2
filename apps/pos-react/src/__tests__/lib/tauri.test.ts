import { describe, expect, it } from "vitest";
import { isTauri, safeInvoke } from "@/lib/tauri";

describe("tauri detection", () => {
  it("detects a non-Tauri environment (jsdom/browser)", () => {
    expect(isTauri()).toBe(false);
  });

  it("safeInvoke throws a clear error outside Tauri instead of touching invoke", async () => {
    await expect(safeInvoke("list_backups")).rejects.toThrow(
      "solo en la aplicación de escritorio"
    );
  });
});
