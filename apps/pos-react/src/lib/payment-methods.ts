import type { PaymentMethod } from "@/lib/types";

/**
 * Colores categóricos por método de pago — única fuente de verdad del POS.
 *
 * Antes este mapa existía duplicado en `PaymentMethodsEditor.tsx` y
 * `DashboardDialog.tsx`, y las copias divergieron: `POINTS` era `#64748b`
 * en un lado y `#84cc16` en el otro. Toda la UI de métodos de pago importa
 * este módulo.
 *
 * Son colores de IDENTIDAD (categorías), no semánticos: el board Ruta C no
 * gobierna la paleta categórica. `CASH` adhiere a la semántica de success
 * del tema (`var(--color-success)`); el resto conserva la paleta Tailwind
 * original del producto para no romper el dato persistido de los usuarios.
 */
export const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: "var(--color-success)",
  DEBIT: "#3b82f6",
  CREDIT: "#8b5cf6",
  QR: "#f59e0b",
  WALLET: "#ec4899",
  TRANSFER: "#06b6d4",
  POINTS: "#84cc16",
};

/**
 * Métodos desconocidos o legacy que llegan de la API como string libre
 * (`ApiPaymentMethodBreakdown.payment_method`): gris neutro, agnóstico.
 */
export const UNKNOWN_METHOD_COLOR = "#64748b";

export function methodColor(id: string): string {
  return METHOD_COLORS[id as PaymentMethod] ?? UNKNOWN_METHOD_COLOR;
}