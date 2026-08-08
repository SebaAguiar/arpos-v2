import { NavLink } from "react-router-dom";
import {
  BackpackIcon,
  CubeIcon,
  BarChartIcon,
  GearIcon,
  LightningBoltIcon,
  TimerIcon,
  LayersIcon,
  PersonIcon,
  ClipboardIcon,
  CardStackIcon,
  ArchiveIcon,
} from "@radix-ui/react-icons";

const ITEM_BASE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "transparent",
  fontSize: "13px",
  fontWeight: 400,
  color: "var(--text-secondary)",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  textDecoration: "none",
  transition: "all 120ms ease",
};

const ITEM_ACTIVE: React.CSSProperties = {
  ...ITEM_BASE,
  fontWeight: 600,
  color: "var(--text-primary)",
  backgroundColor: "var(--bg-surface-hover)",
};

const SECTION_HEADER: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  padding: "0 12px",
  marginBottom: "4px",
  marginTop: "2px",
};

function SidebarNavLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<{ width?: number; height?: number }>;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => (isActive ? ITEM_ACTIVE : ITEM_BASE)}
      onMouseEnter={(e) => {
        if (!e.currentTarget.classList.contains("active")) {
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!e.currentTarget.classList.contains("active")) {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "60%",
                backgroundColor: "var(--accent)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          )}
          <Icon width={16} height={16} />
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        height: "100%",
        flexShrink: 0,
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent)", margin: 0 }}>
          Arcon
        </h1>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>v2.0</p>
      </div>

      {/* Scrollable nav */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 8px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
        className="no-scrollbar"
      >
        {/* POS */}
        <div>
          <SidebarNavLink to="/" icon={BackpackIcon} label="POS — Ventas" />
        </div>

        {/* Operación */}
        <div>
          <div style={SECTION_HEADER}>Operación</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <SidebarNavLink to="/cash-register" icon={LightningBoltIcon} label="Caja" />
            <SidebarNavLink to="/tasks" icon={TimerIcon} label="Tareas" />
          </div>
        </div>

        {/* Gestión */}
        <div>
          <div style={SECTION_HEADER}>Gestión</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <SidebarNavLink to="/products" icon={CubeIcon} label="Productos" />
            <SidebarNavLink to="/inventory" icon={LayersIcon} label="Inventario" />
            <SidebarNavLink to="/purchases" icon={ClipboardIcon} label="Compras" />
            <SidebarNavLink to="/customers" icon={PersonIcon} label="Clientes" />
            <SidebarNavLink to="/wallet" icon={CardStackIcon} label="Billetera" />
          </div>
        </div>

        {/* Analítica */}
        <div>
          <div style={SECTION_HEADER}>Analítica</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <SidebarNavLink to="/reports" icon={BarChartIcon} label="Reportes" />
          </div>
        </div>
      </div>

      {/* Bottom — Sistema */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--border)",
          padding: "8px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <SidebarNavLink to="/settings/backup" icon={ArchiveIcon} label="Backups" />
          <SidebarNavLink to="/settings" icon={GearIcon} label="Configuración" />
        </div>
      </div>
    </aside>
  );
}
