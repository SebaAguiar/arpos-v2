import { type CSSProperties } from "react";

export interface FilterTab<T extends string> {
  value: T;
  label: string;
}

interface FilterTabsProps<T extends string> {
  options: readonly FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "neutral" | "accent";
  style?: CSSProperties;
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  variant = "neutral",
  style,
}: FilterTabsProps<T>) {
  const isAccent = variant === "accent";
  return (
    <div style={{ display: "flex", gap: isAccent ? "6px" : "4px", ...style }}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              padding: isAccent ? "5px 12px" : "4px 10px",
              borderRadius: isAccent ? "8px" : "4px",
              border: isAccent ? "1px solid" : "1px solid var(--border)",
              ...(isAccent
                ? {
                    borderColor: isActive ? "var(--accent)" : "var(--gray-a5)",
                    backgroundColor: isActive ? "var(--accent-subtle)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  }
                : {
                    backgroundColor: isActive ? "var(--bg-surface-hover)" : "transparent",
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  }),
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}