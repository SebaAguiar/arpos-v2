export type ChartPoint = { label: string; value: number; fullLabel?: string };

export const BAR_CHART_HEIGHT = 140;
export const BAR_LABEL_HEIGHT = 28;
export const BAR_COLOR = "#60a5fa";
export const BAR_PEAK_COLOR = "var(--accent)";
export const PREV_BAR_COLOR = "#94a3b8";
export const Y_AXIS_WIDTH = 52;

// Show at most this many date labels on the X axis to avoid truncation.
// Real sampling is derived from the point count so it scales to any period.
export const MAX_X_LABELS = 14;

export function computeLabelStep(dataLength: number, maxLabels = MAX_X_LABELS): number {
  return Math.max(1, Math.ceil(dataLength / maxLabels));
}

export function formatMoneyShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

export function niceCeil(value: number): number {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / pow;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * pow;
}