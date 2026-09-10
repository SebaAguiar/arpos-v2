import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { FilterTabs } from "@/components/ui/FilterTabs";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

const OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendiente" },
] as const;

describe("FilterTabs", () => {
  it("renders all options", () => {
    renderWithTheme(<FilterTabs options={OPTIONS} value="all" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pendiente" })).toBeInTheDocument();
  });

  it("marks the active option and calls onChange on click", () => {
    const onChange = vi.fn();
    renderWithTheme(<FilterTabs options={OPTIONS} value="all" onChange={onChange} />);

    const active = screen.getByRole("button", { name: "Todas" });
    const inactive = screen.getByRole("button", { name: "Pendiente" });

    expect(active).toHaveAttribute(
      "style",
      expect.stringContaining("font-weight: 600"),
    );
    expect(inactive).toHaveAttribute(
      "style",
      expect.stringContaining("font-weight: 400"),
    );

    fireEvent.click(inactive);
    expect(onChange).toHaveBeenCalledWith("pending");
  });

  it("renders the accent variant when requested", () => {
    renderWithTheme(
      <FilterTabs variant="accent" options={OPTIONS} value="all" onChange={() => {}} />,
    );
    const active = screen.getByRole("button", { name: "Todas" });
    expect(active).toHaveAttribute("style", expect.stringContaining("var(--accent-subtle)"));
  });

  it("merges extra style overrides on the container", () => {
    renderWithTheme(
      <FilterTabs
        options={OPTIONS}
        value="all"
        onChange={() => {}}
        style={{ marginBottom: "12px" }}
      />,
    );
    const container = screen.getByRole("button", { name: "Todas" }).parentElement;
    expect(container).toHaveStyle("margin-bottom: 12px");
  });
});