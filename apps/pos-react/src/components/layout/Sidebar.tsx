import { NavLink } from "react-router-dom";
import {
  BackpackIcon,
  CubeIcon,
  BarChartIcon,
  GearIcon,
  LightningBoltIcon,
  TimerIcon,
} from "@radix-ui/react-icons";
import { useDialogStore } from "@/stores/dialog.store";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ width?: number; height?: number }>;
  action: () => void;
  active: boolean;
  badge?: number;
}

const ITEM_BASE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "none",
  background: "none",
  fontSize: "13px",
  fontWeight: 400,
  color: "#888",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  transition: "all 120ms ease",
};

const ITEM_ACTIVE: React.CSSProperties = {
  ...ITEM_BASE,
  fontWeight: 600,
  color: "#ededed",
  backgroundColor: "#252525",
};

const SECTION_HEADER: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#666",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  padding: "0 12px",
  marginBottom: "4px",
  marginTop: "2px",
};

export function Sidebar() {
  const openDashboard = useDialogStore((s) => s.openDashboard);
  const openProductManagement = useDialogStore((s) => s.openProductManagement);
  const openCashControl = useDialogStore((s) => s.openCashControl);
  const openTasks = useDialogStore((s) => s.openTasks);
  const openReports = useDialogStore((s) => s.openReports);
  const openSettings = useDialogStore((s) => s.openSettings);

  const cashCtrl = useDialogStore((s) => s.cashControl);
  const tasksOpen = useDialogStore((s) => s.tasks);
  const productMgmt = useDialogStore((s) => s.productManagement);
  const dashboardOpen = useDialogStore((s) => s.dashboard);

  const operacion: NavItem[] = [
    { label: "Caja", icon: LightningBoltIcon, action: openCashControl, active: cashCtrl },
    { label: "Tareas", icon: TimerIcon, action: openTasks, active: tasksOpen },
  ];

  const gestion: NavItem[] = [
    { label: "Productos", icon: CubeIcon, action: openProductManagement, active: productMgmt },
  ];

  const analitica: NavItem[] = [
    { label: "Dashboard", icon: BarChartIcon, action: openDashboard, active: dashboardOpen },
    { label: "Reportes", icon: BarChartIcon, action: openReports, active: false },
  ];

  return (
    <aside
      style={{
        width: "220px",
        height: "100%",
        flexShrink: 0,
        backgroundColor: "#1a1a1a",
        borderRight: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "16px 16px 12px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#e54d2e", margin: 0 }}>
          ArPOS
        </h1>
        <p style={{ fontSize: "11px", color: "#555", margin: 0 }}>v2.0</p>
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
        {/* POS — route-based, always visible */}
        <div>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              ...isActive ? ITEM_ACTIVE : ITEM_BASE,
            })}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "3px",
                height: "60%",
                borderRadius: "0 2px 2px 0",
              }}
            />
            <BackpackIcon width={16} height={16} />
            POS — Ventas
          </NavLink>
        </div>

        {/* Operación */}
        <div>
          <div style={SECTION_HEADER}>Operación</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {operacion.map((item) => (
              <SidebarButton key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* Gestión */}
        <div>
          <div style={SECTION_HEADER}>Gestión</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {gestion.map((item) => (
              <SidebarButton key={item.label} item={item} />
            ))}
          </div>
        </div>

        {/* Analítica */}
        <div>
          <div style={SECTION_HEADER}>Analítica</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {analitica.map((item) => (
              <SidebarButton key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom — Configuración */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #2a2a2a",
          padding: "8px",
        }}
      >
        <SidebarButton
          item={{
            label: "Configuración",
            icon: GearIcon,
            action: openSettings,
            active: false,
          }}
        />
      </div>
    </aside>
  );
}

function SidebarButton({ item }: { item: NavItem }) {
  const { label, icon: Icon, action, active, badge } = item;

  return (
    <button
      onClick={action}
      style={active ? ITEM_ACTIVE : ITEM_BASE}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "#ededed";
          e.currentTarget.style.backgroundColor = "#252525";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "#888";
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {active && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "3px",
            height: "60%",
            backgroundColor: "#e54d2e",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}
      <Icon width={16} height={16} />
      {label}
      {badge != null && badge > 0 && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: "10px",
            fontWeight: 700,
            color: "#ededed",
            backgroundColor: "#e54d2e",
            borderRadius: "10px",
            padding: "1px 6px",
            lineHeight: "16px",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
