import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { SummaryCard } from "@/components/ui/SummaryCard";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("SummaryCard", () => {
  it("renders the title", () => {
    renderWithTheme(<SummaryCard title="Inventario"><span>contenido</span></SummaryCard>);
    expect(screen.getByText("Inventario")).toBeInTheDocument();
  });

  it("renders children", () => {
    renderWithTheme(<SummaryCard title="Caja"><span>contenido</span></SummaryCard>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("uses the card container styles", () => {
    renderWithTheme(<SummaryCard title="Caja"><span>contenido</span></SummaryCard>);
    const title = screen.getByText("Caja");
    const container = title.parentElement;
    expect(container).toHaveAttribute("style", expect.stringContaining("var(--bg-surface-hover)"));
    expect(container).toHaveStyle("border-radius: 8px");
    expect(container).toHaveStyle("display: flex");
  });
});