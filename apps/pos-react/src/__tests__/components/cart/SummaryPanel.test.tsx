import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SummaryPanel } from "@/components/cart/SummaryPanel";
import { useCartStore } from "@/stores/cart.store";

beforeEach(() => {
  useCartStore.setState({
    items: [],
    discount: 0,
    discountType: "fixed",
    taxRate: 0.21,
    customerId: null,
    customerName: null,
    channel: "COUNTER",
    note: "",
    lastRemoved: null,
  });
});

describe("SummaryPanel", () => {
  it("disables the charge button when the cart is empty", () => {
    render(<SummaryPanel onCharge={vi.fn()} onCustomerClick={vi.fn()} />);
    expect(screen.getByText("Cobrar")).toBeDisabled();
    expect(screen.getByText("Seleccionar cliente")).toBeInTheDocument();
  });

  it("renders totals and enables charge when the cart has items", () => {
    useCartStore.getState().addItem({
      productId: "p1",
      name: "Remera",
      price: 1000,
      quantity: 2,
    });

    render(<SummaryPanel onCharge={vi.fn()} onCustomerClick={vi.fn()} />);

    expect(screen.getByText("$2.000")).toBeInTheDocument();
    expect(screen.getByText("IVA (21%)")).toBeInTheDocument();
    expect(screen.getByText("Cobrar")).toBeEnabled();
  });

  it("shows the customer name when one is selected", () => {
    useCartStore.getState().setCustomer("c1", "Juan Pérez");
    render(<SummaryPanel onCharge={vi.fn()} onCustomerClick={vi.fn()} />);
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
  });

  it("calls onCharge when Cobrar is clicked", () => {
    const onCharge = vi.fn();
    useCartStore.getState().addItem({
      productId: "p1",
      name: "Remera",
      price: 1000,
      quantity: 1,
    });

    render(<SummaryPanel onCharge={onCharge} onCustomerClick={vi.fn()} />);
    fireEvent.click(screen.getByText("Cobrar"));
    expect(onCharge).toHaveBeenCalledTimes(1);
  });

  it("switches between percentage and fixed discount", () => {
    useCartStore.getState().addItem({
      productId: "p1",
      name: "Remera",
      price: 1000,
      quantity: 1,
    });
    useCartStore.getState().setDiscount(10, "percentage");

    render(<SummaryPanel onCharge={vi.fn()} onCustomerClick={vi.fn()} />);

    const badge = screen.getByText("%");
    fireEvent.click(badge);
    expect(screen.getByText("$")).toBeInTheDocument();
  });
});
