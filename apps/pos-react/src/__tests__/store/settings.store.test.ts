import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "@/stores/settings.store";

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState(useSettingsStore.getInitialState());
});

describe("settings store", () => {
  it("has sane defaults", () => {
    const s = useSettingsStore.getState();
    expect(s.paymentMethods.length).toBeGreaterThanOrEqual(5);
    expect(s.paymentMethods[0]?.id).toBe("CASH");
    expect(s.paymentMethods.find((m) => m.id === "CASH")?.enabled).toBe(true);
    expect(s.taxRate).toBe(0.21);
    expect(s.autoPrint).toBe(false);
  });

  it("toggles a payment method", () => {
    useSettingsStore.getState().togglePaymentMethod("QR");
    expect(useSettingsStore.getState().paymentMethods.find((m) => m.id === "QR")?.enabled).toBe(false);
    useSettingsStore.getState().togglePaymentMethod("QR");
    expect(useSettingsStore.getState().paymentMethods.find((m) => m.id === "QR")?.enabled).toBe(true);
  });

  it("updates a payment method label", () => {
    useSettingsStore.getState().updatePaymentMethodLabel("CASH", "Efectivo $");
    expect(useSettingsStore.getState().paymentMethods.find((m) => m.id === "CASH")?.label).toBe("Efectivo $");
  });

  it("updates surcharge and tax rate", () => {
    useSettingsStore.getState().setCreditSurcharge(5);
    useSettingsStore.getState().setTaxRate(0.105);
    const s = useSettingsStore.getState();
    expect(s.creditSurcharge).toBe(5);
    expect(s.taxRate).toBe(0.105);
  });

  it("persists state to localStorage", () => {
    useSettingsStore.getState().setTaxRate(0.0);
    expect(useSettingsStore.persist.hasHydrated()).toBe(true);
    expect(localStorage.getItem("arpos-settings")).toContain("taxRate");
  });
});
