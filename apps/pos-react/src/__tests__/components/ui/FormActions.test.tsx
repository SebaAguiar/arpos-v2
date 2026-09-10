import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { FormActions } from "@/components/ui/FormActions";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("FormActions", () => {
  it("renders children", () => {
    renderWithTheme(
      <FormActions>
        <button>Guardar</button>
      </FormActions>,
    );
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("renders with flex-end alignment and gap", () => {
    renderWithTheme(
      <FormActions>
        <button>Cancelar</button>
      </FormActions>,
    );
    const container = screen.getByRole("button", { name: "Cancelar" }).parentElement;
    expect(container).toHaveStyle("display: flex");
    expect(container).toHaveStyle("justify-content: flex-end");
    expect(container).toHaveStyle("gap: 8px");
  });

  it("applies marginTop when provided", () => {
    renderWithTheme(
      <FormActions marginTop="8px">
        <button>Guardar</button>
      </FormActions>,
    );
    const container = screen.getByRole("button", { name: "Guardar" }).parentElement;
    expect(container).toHaveStyle("margin-top: 8px");
  });

  it("does not add marginTop when omitted", () => {
    renderWithTheme(
      <FormActions>
        <button>Guardar</button>
      </FormActions>,
    );
    const container = screen.getByRole("button", { name: "Guardar" }).parentElement;
    expect(container).not.toHaveStyle("margin-top: 8px");
  });

  it("merges extra style overrides", () => {
    renderWithTheme(
      <FormActions style={{ padding: "16px" }}>
        <button>Guardar</button>
      </FormActions>,
    );
    const container = screen.getByRole("button", { name: "Guardar" }).parentElement;
    expect(container).toHaveStyle("padding: 16px");
  });
});