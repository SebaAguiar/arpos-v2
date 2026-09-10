import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PageSearchInput } from "@/components/ui/PageSearchInput";

describe("PageSearchInput", () => {
  it("binds value and onChange", () => {
    const onChange = vi.fn();
    render(
      <PageSearchInput
        placeholder="Buscar..."
        ariaLabel="Buscar productos"
        value="remera"
        onChange={onChange}
      />,
    );
    expect(screen.getByLabelText("Buscar productos")).toHaveValue("remera");
    fireEvent.change(screen.getByLabelText("Buscar productos"), {
      target: { value: "pantalón" },
    });
    expect(onChange).toHaveBeenCalledWith("pantalón");
  });

  it("shows a clear button that empties the search", () => {
    const onChange = vi.fn();
    render(
      <PageSearchInput
        placeholder="Buscar..."
        ariaLabel="Buscar productos"
        value="remera"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Limpiar búsqueda"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("hides the clear button when the search is empty", () => {
    render(
      <PageSearchInput
        placeholder="Buscar..."
        ariaLabel="Buscar productos"
        value=""
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Limpiar búsqueda")).not.toBeInTheDocument();
  });
});