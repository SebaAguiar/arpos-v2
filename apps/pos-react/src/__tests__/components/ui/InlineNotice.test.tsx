import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { InlineNotice } from "@/components/ui/InlineNotice";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

describe("InlineNotice", () => {
  it("renders an error notice with an alert icon by default", () => {
    renderWithTheme(<InlineNotice>Hubo un error</InlineNotice>);
    expect(screen.getByText("Hubo un error")).toBeInTheDocument();
    expect(document.querySelector("svg")).not.toBeNull();
  });

  it("hides the icon when icon is false", () => {
    renderWithTheme(<InlineNotice icon={false}>Sin icono</InlineNotice>);
    expect(screen.getByText("Sin icono")).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeNull();
  });

  it("applies a bordered danger style by default", () => {
    renderWithTheme(<InlineNotice>Error</InlineNotice>);
    const notice = screen.getByText("Error").closest("div");
    expect(notice).toHaveStyle({
      backgroundColor: "var(--color-danger-subtle)",
      borderRadius: "6px",
    });
  });

  it("drops the border when bordered is false", () => {
    renderWithTheme(<InlineNotice bordered={false}>Sin borde</InlineNotice>);
    const notice = screen.getByText("Sin borde").closest("div");
    expect(notice?.style.border).toBe("");
  });

  it("supports success tone", () => {
    renderWithTheme(<InlineNotice tone="success">Listo</InlineNotice>);
    expect(screen.getByText("Listo")).toHaveAttribute("data-accent-color", "green");
  });

  it("merges custom style props", () => {
    renderWithTheme(
      <InlineNotice style={{ marginTop: "12px" }}>Con margen</InlineNotice>,
    );
    const notice = screen.getByText("Con margen").closest("div");
    expect(notice?.style.marginTop).toBe("12px");
  });

  it("renders an action element after the message", () => {
    renderWithTheme(
      <InlineNotice action={<button>Cerrar</button>}>Error</InlineNotice>,
    );
    expect(screen.getByText("Cerrar")).toBeInTheDocument();
  });
});