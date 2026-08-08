import { create } from "zustand";

interface DialogState {
  payment: boolean;
  customerSelection: boolean;
  salesHistory: boolean;
  cashControl: boolean;
  cashMovement: boolean;
  settings: boolean;
  dashboard: boolean;
  tasks: boolean;
  reports: boolean;
  suspendedOrders: boolean;
  variantSelection: boolean;
  users: boolean;
  stores: boolean;
  selectedProductId: string | null;

  openPayment: () => void;
  closePayment: () => void;
  openCustomerSelection: () => void;
  closeCustomerSelection: () => void;
  openSalesHistory: () => void;
  closeSalesHistory: () => void;
  openCashControl: () => void;
  closeCashControl: () => void;
  openCashMovement: () => void;
  closeCashMovement: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openDashboard: () => void;
  closeDashboard: () => void;
  openTasks: () => void;
  closeTasks: () => void;
  openReports: () => void;
  closeReports: () => void;
  openSuspendedOrders: () => void;
  closeSuspendedOrders: () => void;
  openVariantSelection: (productId: string) => void;
  closeVariantSelection: () => void;
  openUsers: () => void;
  closeUsers: () => void;
  openStores: () => void;
  closeStores: () => void;
  closeAll: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  payment: false,
  customerSelection: false,
  salesHistory: false,
  cashControl: false,
  cashMovement: false,
  settings: false,
  dashboard: false,
  tasks: false,
  reports: false,
  suspendedOrders: false,
  variantSelection: false,
  users: false,
  stores: false,
  selectedProductId: null,

  openPayment: () => set({ payment: true }),
  closePayment: () => set({ payment: false }),
  openCustomerSelection: () => set({ customerSelection: true }),
  closeCustomerSelection: () => set({ customerSelection: false }),
  openSalesHistory: () => set({ salesHistory: true }),
  closeSalesHistory: () => set({ salesHistory: false }),
  openCashControl: () => set({ cashControl: true }),
  closeCashControl: () => set({ cashControl: false }),
  openCashMovement: () => set({ cashMovement: true }),
  closeCashMovement: () => set({ cashMovement: false }),
  openSettings: () => set({ settings: true }),
  closeSettings: () => set({ settings: false }),
  openDashboard: () => set({ dashboard: true }),
  closeDashboard: () => set({ dashboard: false }),
  openTasks: () => set({ tasks: true }),
  closeTasks: () => set({ tasks: false }),
  openReports: () => set({ reports: true }),
  closeReports: () => set({ reports: false }),
  openSuspendedOrders: () => set({ suspendedOrders: true }),
  closeSuspendedOrders: () => set({ suspendedOrders: false }),
  openVariantSelection: (productId) =>
    set({ variantSelection: true, selectedProductId: productId }),
  closeVariantSelection: () =>
    set({ variantSelection: false, selectedProductId: null }),
  openUsers: () => set({ users: true }),
  closeUsers: () => set({ users: false }),
  openStores: () => set({ stores: true }),
  closeStores: () => set({ stores: false }),
  closeAll: () =>
    set({
      payment: false,
      customerSelection: false,
      salesHistory: false,
      cashControl: false,
      cashMovement: false,
      settings: false,
      dashboard: false,
      tasks: false,
      reports: false,
      suspendedOrders: false,
      variantSelection: false,
      users: false,
      stores: false,
      selectedProductId: null,
    }),
}));
