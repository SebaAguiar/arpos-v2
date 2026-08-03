import { create } from "zustand";
import type { CartItem, SaleChannel } from "@/lib/types";

interface CartState {
  items: CartItem[];
  discount: number;
  discountType: "percentage" | "fixed";
  taxRate: number;
  customerId: string | null;
  customerName: string | null;
  channel: SaleChannel;
  note: string;
  lastRemoved: CartItem | null;

  addItem: (item: Omit<CartItem, "id">) => void;
  addCustomItem: (name: string, price: number, quantity?: number) => void;
  updateCustomItem: (itemId: string, patch: { name?: string; price?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setDiscount: (value: number, type: "percentage" | "fixed") => void;
  setTaxRate: (rate: number) => void;
  setCustomer: (id: string | null, name: string | null) => void;
  setChannel: (channel: SaleChannel) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
}

let nextId = 1;

export const useCartStore = create<CartState>((set) => ({
  items: [],
  discount: 0,
  discountType: "fixed",
  taxRate: 0.21,
  customerId: null,
  customerName: null,
  channel: "COUNTER",
  note: "",
  lastRemoved: null,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find(
        (i) =>
          i.productId === item.productId &&
          i.variantId === item.variantId &&
          !i.custom
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === existing.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return {
        items: [...state.items, { ...item, id: `cart-${nextId++}` }],
      };
    }),

  addCustomItem: (name, price, quantity = 1) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          id: `cart-${nextId++}`,
          productId: "custom",
          name,
          price,
          quantity,
          custom: true,
        },
      ],
    })),

  updateCustomItem: (itemId, patch) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === itemId && i.custom ? { ...i, ...patch } : i
      ),
    })),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== itemId),
      lastRemoved: state.items.find((i) => i.id === itemId) || null,
    })),

  updateQuantity: (itemId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== itemId)
          : state.items.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
    })),

  setDiscount: (value, type) => set({ discount: value, discountType: type }),
  setTaxRate: (rate) => set({ taxRate: rate }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setChannel: (channel) => set({ channel }),
  setNote: (note) => set({ note }),

  clearCart: () =>
    set({
      items: [],
      discount: 0,
      customerId: null,
      customerName: null,
      note: "",
      lastRemoved: null,
    }),
}));

// Selectors
export const selectSubtotal = (s: CartState) =>
  s.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectTaxAmount = (s: CartState) => {
  const sub = s.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return sub * s.taxRate;
};

export const selectDiscountAmount = (s: CartState) => {
  const sub = s.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return s.discountType === "percentage"
    ? sub * (s.discount / 100)
    : s.discount;
};

export const selectTotal = (s: CartState) => {
  const sub = s.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = sub * s.taxRate;
  const disc =
    s.discountType === "percentage"
      ? sub * (s.discount / 100)
      : s.discount;
  return sub + tax - disc;
};

export const selectItemCount = (s: CartState) =>
  s.items.reduce((sum, item) => sum + item.quantity, 0);
