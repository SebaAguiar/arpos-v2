import {
  CashRegisterService,
  type ApiCashRegister,
} from "../services/cash-register.service";

export interface CashShiftData {
  id: string;
  name: string;
  status: "OPEN" | "CLOSED";
  openingAmount: number;
  closingAmount: number | null;
  openedAt: number | null;
  closedAt: number | null;
}

function mapCashRegister(api: ApiCashRegister): CashShiftData {
  return {
    id: api.id,
    name: api.name,
    status: api.status === "open" ? "OPEN" : "CLOSED",
    openingAmount: api.opening_amount / 100,
    closingAmount: api.closing_amount != null ? api.closing_amount / 100 : null,
    openedAt: api.opened_at,
    closedAt: api.closed_at,
  };
}

export const CashRegisterRepository = {
  async getCurrent(): Promise<CashShiftData | null> {
    const register = await CashRegisterService.getCurrent();
    return register ? mapCashRegister(register) : null;
  },

  async getAll(): Promise<CashShiftData[]> {
    const registers = await CashRegisterService.list();
    return registers.map(mapCashRegister);
  },

  async open(name: string, openingAmount: number): Promise<CashShiftData> {
    const created = await CashRegisterService.open({
      name,
      opening_amount: Math.round(openingAmount * 100),
    });
    return mapCashRegister(created);
  },

  async close(id: string, closingAmount: number): Promise<CashShiftData> {
    const closed = await CashRegisterService.close(id, Math.round(closingAmount * 100));
    return mapCashRegister(closed);
  },
};
