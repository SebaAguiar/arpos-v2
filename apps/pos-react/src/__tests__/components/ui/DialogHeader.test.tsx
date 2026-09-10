import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { DialogHeader } from "@/components/ui/DialogHeader";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("DialogHeader", () => {
  it("renders the title", () => {
    renderWithTheme(<DialogHeader title="Ventas" />);
    expect(screen.getByText("Ventas")).toBeInTheDocument();
  });

  it("renders the icon and badge next to the title", () => {
    renderWithTheme(
      <DialogHeader title="Tareas" icon={<span data-testid="icono" />} badge={<span>2 pendientes</span>} />,
    );
    expect(screen.getByTestId("icono")).toBeInTheDocument();
    expect(screen.getByText("2 pendientes")).toBeInTheDocument();
  });

  it("renders extra actions on the right side", () => {
    renderWithTheme(<DialogHeader title="Configuración" right={<button>Guardar</button>} />);
    expect(screen.getByText("Guardar")).toBeInTheDocument();
  });

  it("does not render a close button when onClose is not provided", () => {
    renderWithTheme(<DialogHeader title="Ventas" />);
    expect(screen.queryByRole("button", { name: "Cerrar" })).toBeNull();
  });

  it("renders a close button and calls onClose when clicked", () => {
    const onClose = vi.fn();
    renderWithTheme(<DialogHeader title="Ventas" onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: "Cerrar" });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});