import { type Ref } from "react";
import { TextField, IconButton } from "@radix-ui/themes";
import { MagnifyingGlassIcon, Cross2Icon } from "@radix-ui/react-icons";

interface PageSearchInputProps {
  placeholder: string;
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
}

export function PageSearchInput({
  placeholder,
  ariaLabel,
  value,
  onChange,
  inputRef,
}: PageSearchInputProps) {
  return (
    <TextField.Root
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "320px" }}
      aria-label={ariaLabel}
    >
      <TextField.Slot>
        <MagnifyingGlassIcon width={16} height={16} color="gray" />
      </TextField.Slot>
      {value && (
        <TextField.Slot>
          <IconButton
            size="1"
            variant="ghost"
            color="gray"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
          >
            <Cross2Icon width={14} height={14} />
          </IconButton>
        </TextField.Slot>
      )}
    </TextField.Root>
  );
}