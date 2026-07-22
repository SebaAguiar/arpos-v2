import { create } from "zustand";
import { ProductsRepository } from "@/repositories/products.repository";
import type {
  Product,
  ProductSortField,
  ProductSortDirection,
} from "@/lib/types";

interface ProductsState {
  products: Product[];
  loading: boolean;
  search: string;
  category: string | null;
  sortField: ProductSortField;
  sortDirection: ProductSortDirection;
  page: number;
  pageSize: number;

  fetchProducts: () => Promise<void>;
  setProducts: (products: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setSearch: (search: string) => void;
  setCategory: (category: string | null) => void;
  setSort: (field: ProductSortField, direction: ProductSortDirection) => void;
  setPage: (page: number) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  products: [],
  loading: false,
  search: "",
  category: null,
  sortField: "name",
  sortDirection: "asc",
  page: 0,
  pageSize: 48,

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const products = await ProductsRepository.getAll();
      set({ products, loading: false, page: 0 });
    } catch {
      set({ loading: false });
    }
  },

  setProducts: (products) => set({ products, page: 0 }),
  setLoading: (loading) => set({ loading }),
  setSearch: (search) => set({ search, page: 0 }),
  setCategory: (category) => set({ category, page: 0 }),
  setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),
  setPage: (page) => set({ page }),
}));

// Selectors
export const selectFilteredProducts = (s: ProductsState) => {
  let result = s.products.filter((p) => p.active);

  if (s.search) {
    const q = s.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.internalCode?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.variants.some(
          (v) =>
            v.barcode?.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q)
        )
    );
  }

  if (s.category) {
    result = result.filter((p) => p.category === s.category);
  }

  result.sort((a, b) => {
    const dir = s.sortDirection === "asc" ? 1 : -1;
    switch (s.sortField) {
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "price":
        return (a.price - b.price) * dir;
      default:
        return 0;
    }
  });

  return result;
};

export const selectCategories = (s: ProductsState) => {
  const cats = new Set(
    s.products.filter((p) => p.category).map((p) => p.category!)
  );
  return Array.from(cats).sort();
};

export const selectTotalPages = (s: ProductsState) => {
  const filtered = selectFilteredProducts(s);
  return Math.ceil(filtered.length / s.pageSize);
};
