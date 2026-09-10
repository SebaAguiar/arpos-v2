import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDeleteDialog } from "@/components/ui/ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  it("renders title, description and confirm button", () => {
    render(
      <ConfirmDeleteDialog
        open
        onOpenChange={vi.fn()}
        title="¿Eliminar producto?"
        description="Esto ocultará el producto."
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText("¿Eliminar producto?")).toBeInTheDocument();
    expect(screen.getByText("Esto ocultará el producto.")).toBeInTheDocument();
    expect(screen.getByText("Sí, eliminar")).toBeInTheDocument();
  });

  it("disables the confirm button while loading", () => {
    render(
      <ConfirmDeleteDialog
        open
        onOpenChange={vi.fn()}
        title="¿Eliminar producto?"
        description="Esto ocultará el producto."
        onConfirm={vi.fn()}
        loading
      />,
    );
    expect(screen.getByText("Eliminando...")).toBeDisabled();
  });

  it("calls onConfirm when confirmed", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDeleteDialog
        open
        onOpenChange={vi.fn()}
        title="¿Eliminar producto?"
        description="Esto ocultará el producto."
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText("Sí, eliminar"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});