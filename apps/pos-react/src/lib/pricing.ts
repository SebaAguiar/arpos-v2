export function calcPriceFromCost(cost: number, marginPercent: number): number {
  return cost * (1 + marginPercent / 100);
}

export function calcMarginFromPrice(cost: number, price: number): number {
  if (cost <= 0 || price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function centsToDecimal(cents: number): number {
  return cents / 100;
}

export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100);
}

export function parseNumericInput(value: string): number {
  const normalized = value.replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}
