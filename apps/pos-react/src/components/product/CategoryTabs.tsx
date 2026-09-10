interface CategoryTabsProps {
  categories: string[];
  active: string | null;
  onChange: (category: string | null) => void;
}

const PILL_BASE: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: "999px",
  border: "1px solid transparent",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "background-color 120ms ease, color 120ms ease, border-color 120ms ease",
};

export function CategoryTabs({ categories, active, onChange }: CategoryTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
        padding: "8px 12px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <button
        onClick={() => onChange(null)}
        aria-pressed={active === null}
        style={{
          ...PILL_BASE,
          backgroundColor: active === null ? "var(--accent)" : "var(--bg-surface-hover)",
          color: active === null ? "#fff" : "var(--text-secondary)",
          borderColor: active === null ? "var(--accent)" : "var(--border)",
        }}
      >
        Todos
      </button>
      {categories.map((category) => {
        const isActive = active === category;
        return (
          <button
            key={category}
            onClick={() => onChange(isActive ? null : category)}
            aria-pressed={isActive}
            style={{
              ...PILL_BASE,
              backgroundColor: isActive ? "var(--accent)" : "var(--bg-surface-hover)",
              color: isActive ? "#fff" : "var(--text-secondary)",
              borderColor: isActive ? "var(--accent)" : "var(--border)",
            }}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
