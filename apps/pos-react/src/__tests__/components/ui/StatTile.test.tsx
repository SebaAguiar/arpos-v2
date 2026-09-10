import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { StatTile } from "@/components/ui/StatTile";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("StatTile", () => {
  it("renders label and value", () => {
    renderWithTheme(<StatTile label="Productos" value={42} />);
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders with a value color without crashing", () => {
    renderWithTheme(<StatTile label="Sin stock" value={3} color="red" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("uses the hover background for the hover variant", () => {
    renderWithTheme(<StatTile label="Ventas" value="$10" variant="hover" />);
    const value = screen.getByText("$10");
    const container = value.parentElement;
    expect(container).toHaveAttribute("style", expect.stringContaining("var(--bg-surface-hover)"));
  });

  it("uses the surface background by default", () => {
    renderWithTheme(<StatTile label="Turnos" value={1} />);
    const container = screen.getByText("Turnos").parentElement;
    expect(container).toHaveAttribute("style", expect.stringContaining("var(--bg-surface)"));
  });

  it("uses a tighter value margin for size 3", () => {
    renderWithTheme(<StatTile label="Egresos" value={-5} size="3" />);
    expect(screen.getByText("-5")).toHaveStyle("margin-top: 2px");
  });
});