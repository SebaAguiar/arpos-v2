export function calcExpectedBalance(
  initialAmount: number,
  totalSales: number,
  totalIncome: number,
  totalExpenses: number,
): number {
  return initialAmount + totalSales + totalIncome - totalExpenses;
}