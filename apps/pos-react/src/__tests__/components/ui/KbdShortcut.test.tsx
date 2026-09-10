import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KbdShortcut } from "@/components/ui/KbdShortcut";

describe("KbdShortcut", () => {
  it("renders the label", () => {
    render(<KbdShortcut label="N" />);
    expect(screen.getByText("N")).toBeInTheDocument();
  });
});