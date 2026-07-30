import { useState, useEffect, useCallback } from "react";
import { TextField, Text } from "@radix-ui/themes";
import {
  calcPriceFromCost,
  calcMarginFromPrice,
  parseNumericInput,
} from "@/lib/pricing";

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
  const [syncing, setSyncing] = useState<"cost" | "margin" | "price" | null>(
    null,
  );

  const handleCostChange = useCallback(
    (raw: string) => {
      const cost = parseNumericInput(raw);
      const currentMargin = parseNumericInput(values.margin);

      if (cost > 0 && currentMargin > 0) {
        const price = calcPriceFromCost(cost, currentMargin);
        onChange({
          cost: raw,
          margin: values.margin,
          price: price.toFixed(2),
        });
      } else {
        onChange({ ...values, cost: raw });
      }
      setSyncing("cost");
    },
    [values.margin, onChange],
  );

  const handleMarginChange = useCallback(
    (raw: string) => {
      const margin = parseNumericInput(raw);
      const cost = parseNumericInput(values.cost);

      if (cost > 0 && margin > 0) {
        const price = calcPriceFromCost(cost, margin);
        onChange({
          cost: values.cost,
          margin: raw,
          price: price.toFixed(2),
        });
      } else {
        onChange({ ...values, margin: raw });
      }
      setSyncing("margin");
    },
    [values.cost, onChange],
  );

  const handlePriceChange = useCallback(
    (raw: string) => {
      const price = parseNumericInput(raw);
      const cost = parseNumericInput(values.cost);

      if (cost > 0 && price > 0) {
        const margin = calcMarginFromPrice(cost, price);
        onChange({
          cost: values.cost,
          margin: margin.toFixed(1),
          price: raw,
        });
      } else {
        onChange({ ...values, price: raw });
      }
      setSyncing("price");
    },
    [values.cost, onChange],
  );

  useEffect(() => {
    if (syncing) {
      const timer = setTimeout(() => setSyncing(null), 600);
      return () => clearTimeout(timer);
    }
  }, [syncing]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "8px",
      }}
    >
      <div>
        <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
          {costLabel}
        </Text>
        <TextField.Root
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={values.cost}
          onChange={(e) => handleCostChange(e.target.value)}
          aria-label={costLabel}
        />
      </div>
      <div>
        <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
          {marginLabel}
        </Text>
        <TextField.Root
          type="number"
          step="0.1"
          min="0"
          placeholder="0.0"
          value={values.margin}
          onChange={(e) => handleMarginChange(e.target.value)}
          aria-label={marginLabel}
        />
      </div>
      <div>
        <Text size="1" weight="bold" style={{ marginBottom: "4px", display: "block" }}>
          {priceLabel} *
        </Text>
        <TextField.Root
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={values.price}
          onChange={(e) => handlePriceChange(e.target.value)}
          aria-label={priceLabel}
        />
      </div>
    </div>
  );
}
