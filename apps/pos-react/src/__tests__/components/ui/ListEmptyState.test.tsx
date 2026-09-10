import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { ListEmptyState } from "@/components/ui/ListEmptyState";
import { CalendarIcon } from "@radix-ui/react-icons";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("ListEmptyState", () => {
  it("renders the message", () => {
    renderWithTheme(<ListEmptyState message="No hay usuarios registrados" />);
    expect(screen.getByText("No hay usuarios registrados")).toBeInTheDocument();
  });

  it("renders the optional icon", () => {
    renderWithTheme(<ListEmptyState message="No hay movimientos" icon={CalendarIcon} />);
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("centers and pads the container", () => {
    renderWithTheme(<ListEmptyState message="No hay sucursales registradas" />);
    const message = screen.getByText("No hay sucursales registradas");
    const container = message.parentElement;
    expect(container).toHaveStyle("text-align: center");
    expect(container).toHaveStyle("padding: 40px 0");
  });
});