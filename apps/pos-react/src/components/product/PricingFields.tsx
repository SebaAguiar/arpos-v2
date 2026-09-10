import { useCallback } from "react";
import { TextField } from "@radix-ui/themes";
import { calcMarginFromPrice, parseNumericInput } from "@/lib/pricing";
import { CurrencyField } from "@/components/product/CurrencyField";
import { FieldLabel } from "@/components/ui/FieldLabel";

export interface PricingValues {
  cost: string;
  margin: string;
  price: string;
}

interface PricingFieldsProps {
  values: PricingValues;
  onChange: (values: PricingValues) => void;
  costLabel?: string;
  marginLabel?: string;
  priceLabel?: string;
}

export function PricingFields({
  values,
  onChange,
  costLabel = "Costo ($)",
  marginLabel = "Margen (%)",
  priceLabel = "Precio de Venta ($)",
}: PricingFieldsProps) {
  const recalcMargin = useCallback(
    (cost: string, price: string) => {
      const c = parseNumericInput(cost);
      const p = parseNumericInput(price);
      const margin = c > 0 && p > 0 ? calcMarginFromPrice(c, p).toFixed(1) : "";
      return { cost, margin, price };
    },
    [],
  );

  const handleCostChange = useCallback(
    (raw: string) => {
      onChange(recalcMargin(raw, values.price));
    },
    [onChange, recalcMargin, values.price],
  );

  const handlePriceChange = useCallback(
    (raw: string) => {
      onChange(recalcMargin(values.cost, raw));
    },
    [onChange, recalcMargin, values.cost],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "8px",
      }}
    >
      <div>
        <FieldLabel size="1" marginBottom="4px">{costLabel}</FieldLabel>
        <CurrencyField
          value={values.cost}
          onChange={handleCostChange}
          ariaLabel={costLabel}
        />
      </div>
      <div>
        <FieldLabel size="1" marginBottom="4px">{marginLabel}</FieldLabel>
        <TextField.Root
          value={values.margin ? `${values.margin}%` : ""}
          placeholder="—"
          aria-label={marginLabel}
          disabled
          style={{ backgroundColor: "var(--bg-surface-hover)" }}
        />
      </div>
      <div>
        <FieldLabel size="1" marginBottom="4px">{priceLabel} *</FieldLabel>
        <CurrencyField
          value={values.price}
          onChange={handlePriceChange}
          ariaLabel={priceLabel}
        />
      </div>
    </div>
  );
}
