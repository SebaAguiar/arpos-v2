import { TextField, DropdownMenu, Avatar, IconButton, Tooltip } from "@radix-ui/themes";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  BellIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  SunIcon,
  MoonIcon,
  LockOpen1Icon,
  LockClosedIcon,
  BarChartIcon,
} from "@radix-ui/react-icons";
import { useThemeStore } from "@/stores/theme.store";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncStore } from "@/stores/sync.store";
import { useDialogStore } from "@/stores/dialog.store";
import { useCashRegisterStore } from "@/stores/cash-register.store";
import { NetworkIndicator } from "./NetworkIndicator";
import { LicenseBadge } from "./LicenseBadge";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { user, logout, licenseStatus } = useAuth();
  const isOnline = useNetworkStatus();
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const isProcessing = useSyncStore((s) => s.isProcessing);
  const isBackendAvailable = useSyncStore((s) => s.isBackendAvailable);
  const fetchStatus = useSyncStore((s) => s.fetchStatus);
  const openCashControl = useDialogStore((s) => s.openCashControl);
  const openDashboard = useDialogStore((s) => s.openDashboard);
  const currentShift = useCashRegisterStore((s) => s.currentShift);

  useEffect(() => {
    if (isOnline) {
      void fetchStatus();
    }
  }, [isOnline, fetchStatus]);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "A";

  return (
    <header
      style={{
        height: "52px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "12px",
        backgroundColor: "var(--bg-surface)",
      }}
    >
      <Tooltip content={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}>
        <IconButton
          variant="ghost"
          size="1"
          onClick={onToggleSidebar}
          style={{ cursor: "pointer", color: "var(--text-secondary)" }}
        >
          {sidebarOpen ? <Cross1Icon width={16} height={16} /> : <HamburgerMenuIcon width={16} height={16} />}
        </IconButton>
      </Tooltip>

      <TextField.Root
        placeholder="Buscar producto..."
        style={{ maxWidth: "320px" }}
      >
        <TextField.Slot>
          <MagnifyingGlassIcon height={16} width={16} />
        </TextField.Slot>
      </TextField.Root>

      <div style={{ flex: 1 }} />

      <Tooltip content={currentShift ? "Cerrar caja" : "Abrir caja"}>
        <button
          onClick={openCashControl}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: currentShift ? "#e54d2e15" : "#30a46c15",
            color: currentShift ? "#e54d2e" : "#30a46c",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {currentShift ? (
            <LockClosedIcon width={14} height={14} />
          ) : (
            <LockOpen1Icon width={14} height={14} />
          )}
          {currentShift ? "Cerrar caja" : "Abrir caja"}
        </button>
      </Tooltip>

      <Tooltip content="Dashboard">
        <IconButton
          variant="ghost"
          size="1"
          onClick={openDashboard}
          style={{ cursor: "pointer", color: "var(--text-secondary)" }}
        >
          <BarChartIcon width={16} height={16} />
        </IconButton>
      </Tooltip>

      <NetworkIndicator
        isOnline={isOnline}
        isBackendAvailable={isBackendAvailable}
        pendingCount={pendingCount}
        isProcessing={isProcessing}
      />

      <LicenseBadge status={licenseStatus} />

      <Tooltip content={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
        <IconButton
          variant="ghost"
          size="1"
          onClick={toggleTheme}
          style={{ cursor: "pointer", color: "var(--text-secondary)" }}
        >
          {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
        </IconButton>
      </Tooltip>

      <IconButton variant="ghost" size="1">
        <BellIcon width={16} height={16} />
      </IconButton>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" size="1" style={{ cursor: "pointer" }}>
            <Avatar size="1" radius="full" fallback={initials} color="orange" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          {user && (
            <>
              <DropdownMenu.Item disabled>
                <span style={{ fontWeight: 600 }}>{user.name}</span>
              </DropdownMenu.Item>
              <DropdownMenu.Item disabled>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user.email}</span>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
            </>
          )}
          <DropdownMenu.Item onClick={() => navigate("/settings")}>Configuración</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item color="red" onClick={logout}>
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </header>
  );
}
