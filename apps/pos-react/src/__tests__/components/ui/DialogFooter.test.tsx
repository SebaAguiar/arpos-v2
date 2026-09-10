import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { DialogFooter } from "@/components/ui/DialogFooter";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("DialogFooter", () => {
  it("renders children", () => {
    renderWithTheme(
      <DialogFooter>
        <button>Cerrar</button>
      </DialogFooter>,
    );
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("renders with default padding, border and flex-end alignment", () => {
    renderWithTheme(
      <DialogFooter>
        <button>Cerrar</button>
      </DialogFooter>,
    );
    const container = screen.getByRole("button", { name: "Cerrar" }).parentElement;
    expect(container).toHaveStyle("padding: 12px 20px");
    expect(container).toHaveAttribute("style", expect.stringContaining("var(--border)"));
    expect(container).toHaveStyle("display: flex");
    expect(container).toHaveStyle("justify-content: flex-end");
    expect(container).toHaveStyle("gap: 8px");
  });

  it("uses borderColor when provided", () => {
    renderWithTheme(
      <DialogFooter borderColor="var(--gray-a3)">
        <button>Cerrar</button>
      </DialogFooter>,
    );
    const container = screen.getByRole("button", { name: "Cerrar" }).parentElement;
    expect(container).toHaveAttribute("style", expect.stringContaining("var(--gray-a3)"));
  });

  it("merges extra style overrides", () => {
    renderWithTheme(
      <DialogFooter style={{ padding: "16px" }}>
        <button>Cerrar</button>
      </DialogFooter>,
    );
    const container = screen.getByRole("button", { name: "Cerrar" }).parentElement;
    expect(container).toHaveStyle("padding: 16px");
  });
});