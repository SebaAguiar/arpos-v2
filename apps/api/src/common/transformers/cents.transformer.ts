export function centsToDecimal(cents: number): number {
  return cents / 100;
}

export function decimalToCents(decimal: number): number {
  if (!Number.isFinite(decimal)) return 0;
  return Math.round(decimal * 100);
}

export function formatCents(cents: number, locale = 'es-AR'): string {
  return (cents / 100).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
