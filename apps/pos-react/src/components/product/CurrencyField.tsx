import { TextField } from "@radix-ui/themes";
import { extractNumericString, formatCurrencyInput } from "@/lib/pricing";

interface CurrencyFieldProps {
  value: string;
  onChange: (value: string) => void;
  size?: "1" | "2" | "3";
  placeholder?: string;
  ariaLabel?: string;
}

export function CurrencyField({
  value,
  onChange,
  size = "2",
  placeholder = "0",
  ariaLabel,
}: CurrencyFieldProps) {
  return (
    <TextField.Root
      size={size}
      inputMode="decimal"
      autoComplete="off"
      value={formatCurrencyInput(value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onFocus={(e) => e.target.select()}
      onChange={(e) => onChange(extractNumericString(e.target.value))}
      style={{ textAlign: "right" }}
    >
      <TextField.Slot>$</TextField.Slot>
    </TextField.Root>
  );
}
