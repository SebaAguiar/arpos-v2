import { WalletService, type ApiWalletTransaction } from "@/services/wallet.service";
import type { WalletTransaction, CreditDebitInput } from "@/lib/types";

function mapTransaction(api: ApiWalletTransaction): WalletTransaction {
  return {
    id: api.id,
    contactId: api.contactId,
    type: api.type as "credit" | "debit",
    amount_cents: api.amount_cents,
    balance_before: api.balance_before,
    balance_after: api.balance_after,
    reference: api.reference,
    reference_id: api.reference_id,
    notes: api.notes,
    created_by: api.created_by,
    created_at: api.created_at,
  };
}

export const WalletRepository = {
  async getBalance(contactId: string): Promise<number> {
    const result = await WalletService.getBalance(contactId);
    return result.balance_cents;
  },

  async getTransactions(contactId: string): Promise<WalletTransaction[]> {
    const transactions = await WalletService.getTransactions(contactId);
    return transactions.map(mapTransaction);
  },

  async credit(
    contactId: string,
    input: CreditDebitInput,
  ): Promise<{ transaction: WalletTransaction; balance_cents: number }> {
    const result = await WalletService.credit(contactId, input);
    return { transaction: mapTransaction(result.transaction), balance_cents: result.balance_cents };
  },

  async debit(
    contactId: string,
    input: CreditDebitInput,
  ): Promise<{ transaction: WalletTransaction; balance_cents: number }> {
    const result = await WalletService.debit(contactId, input);
    return { transaction: mapTransaction(result.transaction), balance_cents: result.balance_cents };
  },
};
