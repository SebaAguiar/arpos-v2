import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { SectionHeader } from "@/components/ui/SectionHeader";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("SectionHeader", () => {
  it("renders the children text", () => {
    renderWithTheme(<SectionHeader>Cliente</SectionHeader>);
    expect(screen.getByText("Cliente")).toBeInTheDocument();
  });

  it("renders with uppercase transform and letter spacing by default", () => {
    renderWithTheme(<SectionHeader>Montos</SectionHeader>);
    const header = screen.getByText("Montos");
    expect(header).toHaveStyle("text-transform: uppercase");
    expect(header).toHaveAttribute("style", expect.stringContaining("letter-spacing: 0.05em"));
    expect(header).toHaveStyle("display: block");
  });

  it("merges extra style overrides", () => {
    renderWithTheme(<SectionHeader style={{ marginBottom: "4px" }}>Fechas</SectionHeader>);
    expect(screen.getByText("Fechas")).toHaveStyle("margin-bottom: 4px");
  });
});