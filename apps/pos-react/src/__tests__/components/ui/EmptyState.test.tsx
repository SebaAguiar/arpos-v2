import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Table } from "@radix-ui/themes";
import { EmptyState } from "@/components/ui/EmptyState";

function renderInTable(ui: React.ReactElement) {
  return render(
    <Table.Root>
      <Table.Body>{ui}</Table.Body>
    </Table.Root>,
  );
}

describe("EmptyState", () => {
  it("renders title and description within a colSpan cell", () => {
    renderInTable(
      <EmptyState colSpan={4} title="Sin resultados" description="Probá otro filtro." />,
    );
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.getByText("Probá otro filtro.")).toBeInTheDocument();
  });

  it("renders the action button and responds to clicks", () => {
    const onClick = vi.fn();
    renderInTable(
      <EmptyState
        colSpan={4}
        title="Vacío"
        description="No hay datos."
        action={{ label: "Crear primero", onClick }}
      />,
    );
    const button = screen.getByText("Crear primero");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});