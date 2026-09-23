import { beforeEach, describe, expect, it } from "vitest";
import {
  useCartStore,
  selectSubtotal,
  selectTaxAmount,
  selectDiscountAmount,
  selectTotal,
  selectItemCount,
} from "@/stores/cart.store";
import type { CartItem } from "@/lib/types";

const initial = () => ({
  items: [],
  discount: 0,
  discountType: "fixed" as const,
  taxRate: 0.21,
  customerId: null,
  customerName: null,
  channel: "COUNTER" as const,
  note: "",
  lastRemoved: null,
});

const productItem: Omit<CartItem, "id"> = {
  productId: "p1",
  name: "Remera Negra",
  price: 1000,
  quantity: 1,
};

beforeEach(() => {
  useCartStore.setState(initial());
});

describe("cart store", () => {
  it("adds a product item", () => {
    useCartStore.getState().addItem(productItem);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ productId: "p1", quantity: 1 });
    expect(items[0].id).toBeTruthy();
  });

  it("merges items with the same productId, variantId and non-custom flag", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().addItem({ ...productItem, quantity: 3 });
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(4);
  });

  it("keeps items with different variants separate", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().addItem({ ...productItem, variantId: "v2" });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("adds custom items without merging", () => {
    useCartStore.getState().addCustomItem("Yerba extra", 500);
    useCartStore.getState().addCustomItem("Yerba extra", 500);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ custom: true, productId: "custom" });
  });

  it("clamps a fresh item quantity to the available stock", () => {
    useCartStore.getState().addItem({ ...productItem, stock: 2, quantity: 5 });
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("clamps the merged quantity when adding beyond the available stock", () => {
    useCartStore.getState().addItem({ ...productItem, stock: 2 });
    useCartStore.getState().addItem({ ...productItem, stock: 2 });
    useCartStore.getState().addItem({ ...productItem, stock: 2 });
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it("does not add a zero-stock item", () => {
    useCartStore.getState().addItem({ ...productItem, stock: 0 });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("clamps updateQuantity to the available stock", () => {
    useCartStore.getState().addItem({ ...productItem, stock: 2 });
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 10);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removes an item and tracks the last removed", () => {
    useCartStore.getState().addItem(productItem);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().removeItem(id);
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().lastRemoved).toMatchObject({ productId: "p1" });
  });

  it("updates quantity and removes the item when quantity drops to zero", () => {
    useCartStore.getState().addItem(productItem);
    const id = useCartStore.getState().items[0].id;
    useCartStore.getState().updateQuantity(id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
    useCartStore.getState().updateQuantity(id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("clears the cart but keeps configuration", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().setDiscount(10, "percentage");
    useCartStore.getState().setCustomer("c1", "Cliente A");
    useCartStore.getState().clearCart();
    const s = useCartStore.getState();
    expect(s.items).toHaveLength(0);
    expect(s.customerId).toBeNull();
    expect(s.discount).toBe(0);
    expect(s.discountType).toBe("percentage");
    expect(s.taxRate).toBe(0.21);
  });
});

describe("cart selectors", () => {
  it("computes subtotal", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().addItem({ ...productItem, productId: "p2", price: 2500, quantity: 2 });
    const sub = selectSubtotal(useCartStore.getState());
    expect(sub).toBe(1000 + 5000);
  });

  it("computes tax amount", () => {
    useCartStore.getState().addItem(productItem);
    expect(selectTaxAmount(useCartStore.getState())).toBe(210);
  });

  it("computes fixed discount", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().setDiscount(100, "fixed");
    expect(selectDiscountAmount(useCartStore.getState())).toBe(100);
  });

  it("computes percentage discount", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().setDiscount(10, "percentage");
    expect(selectDiscountAmount(useCartStore.getState())).toBe(100);
  });

  it("computes total with tax and discount", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().setDiscount(10, "percentage");
    expect(selectTotal(useCartStore.getState())).toBe(1000 + 210 - 100);
  });

  it("counts items by quantity", () => {
    useCartStore.getState().addItem(productItem);
    useCartStore.getState().addItem({ ...productItem, productId: "p2", quantity: 3 });
    expect(selectItemCount(useCartStore.getState())).toBe(4);
  });
});
