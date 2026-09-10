import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Theme } from "@radix-ui/themes";
import { VariantSelectionDialog } from "@/components/product/VariantSelectionDialog";
import type { Product, ProductVariant } from "@/lib/types";

function renderWithTheme(ui: React.ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

function buildVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "var-1",
    size: "M",
    color: "Negro",
    sku: "SKU-M-N",
    price: 15000,
    active: true,
    stockItems: [{ quantity: 3, storeId: "s1" }],
    ...overrides,
  };
}

function buildProduct(variants: ProductVariant[]): Product {
  return {
    id: "p1",
    name: "Remera básica",
    price: 15000,
    active: true,
    variants,
  };
}

describe("VariantSelectionDialog", () => {
  it("renders the product name and a variant row", () => {
    const product = buildProduct([buildVariant()]);
    renderWithTheme(
      <VariantSelectionDialog product={product} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Remera básica")).toBeInTheDocument();
    expect(screen.getByText("Negro")).toBeInTheDocument();
    expect(screen.getByText("3 disponibles")).toBeInTheDocument();
  });

  it("calls onSelect with the product and variant on click", () => {
    const product = buildProduct([buildVariant()]);
    const onSelect = vi.fn();
    renderWithTheme(
      <VariantSelectionDialog product={product} onSelect={onSelect} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("Negro"));
    expect(onSelect).toHaveBeenCalledWith(product, product.variants[0]);
  });

  it("calls onClose when the close button is pressed", () => {
    const product = buildProduct([buildVariant()]);
    const onClose = vi.fn();
    renderWithTheme(
      <VariantSelectionDialog product={product} onSelect={vi.fn()} onClose={onClose} />,
    );
    fireEvent.click(screen.getByLabelText("Cerrar"));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables variant rows when the product has no stock", () => {
    const noStock = buildVariant({
      size: undefined,
      color: undefined,
      stockItems: [{ quantity: 0, storeId: "s1" }],
    });
    const product = buildProduct([noStock]);
    renderWithTheme(
      <VariantSelectionDialog product={product} onSelect={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Sin stock")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Estándar/ })).toBeDisabled();
  });
});