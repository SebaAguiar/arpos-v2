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

export function extractNumericString(value: string): string {
  const s = value.replace(/[^\d.,]/g, "");
  if (!s) return "";
  const commaIdx = s.indexOf(",");
  if (commaIdx !== -1) {
    const intPart = s.slice(0, commaIdx).replace(/\./g, "");
    const decPart = s.slice(commaIdx + 1).replace(/[.,]/g, "").slice(0, 2);
    return decPart ? `${intPart}.${decPart}` : intPart;
  }
  return s.replace(/\./g, "");
}

export function formatCurrencyInput(value: string): string {
  const num = parseNumericInput(value);
  if (isNaN(num) || value.trim() === "") return value;
  const hasDecimals = value.includes(".");
  const decimals = hasDecimals
    ? Math.min((value.split(".")[1] ?? "").length, 2)
    : 0;
  return num.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function unixTimestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function dateToUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function formatUnixTimestamp(timestamp: number, locale = "es-AR"): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale);
}

export function formatUnixDateTime(timestamp: number, locale = "es-AR"): string {
  return new Date(timestamp * 1000).toLocaleString(locale);
}

export function parseJsonField<T = Record<string, unknown>>(
  value: string | null | undefined,
): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function stringifyJsonField(value: unknown): string | null {
  if (value == null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
