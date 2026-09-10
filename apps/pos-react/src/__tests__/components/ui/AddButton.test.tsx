import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddButton } from "@/components/ui/AddButton";

describe("AddButton", () => {
  it("renders the label and fires onClick", () => {
    const onClick = vi.fn();
    render(<AddButton label="Nuevo producto" onClick={onClick} />);
    const button = screen.getByText("Nuevo producto");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows the shortcut badge when provided", () => {
    render(<AddButton label="Nuevo producto" onClick={vi.fn()} shortcut="n" />);
    expect(screen.getByText("N")).toBeInTheDocument();
  });
});