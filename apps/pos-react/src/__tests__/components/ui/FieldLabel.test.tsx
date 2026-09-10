import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { FieldError } from "@/components/ui/FieldError";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("FieldLabel", () => {
  it("renders the label text with block display", () => {
    renderWithTheme(<FieldLabel>Precio</FieldLabel>);
    const label = screen.getByText("Precio");
    expect(label).toHaveStyle({ display: "block", marginBottom: "6px" });
    expect(label).toHaveClass("rt-Text rt-r-size-2 rt-r-weight-bold");
  });

  it("supports size, weight and marginBottom overrides", () => {
    renderWithTheme(
      <FieldLabel size="1" weight="medium" marginBottom="4px">
        Costo
      </FieldLabel>,
    );
    const label = screen.getByText("Costo");
    expect(label).toHaveStyle({ marginBottom: "4px" });
    expect(label).toHaveClass("rt-Text rt-r-size-1 rt-r-weight-medium");
  });
});

describe("FieldError", () => {
  it("renders the error message in red", () => {
    renderWithTheme(<FieldError>Campo obligatorio</FieldError>);
    const error = screen.getByText("Campo obligatorio");
    expect(error).toHaveStyle({ display: "block", marginTop: "4px" });
    expect(error).toHaveAttribute("data-accent-color", "red");
  });
});