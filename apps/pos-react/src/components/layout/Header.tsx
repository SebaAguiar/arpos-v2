import { TextField, DropdownMenu, Avatar, IconButton, Tooltip } from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  BellIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { useThemeStore } from "@/stores/theme.store";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncStore } from "@/stores/sync.store";
import { NetworkIndicator } from "./NetworkIndicator";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const { user, logout } = useAuth();
  const isOnline = useNetworkStatus();
  const pendingCount = useSyncStore((s) => s.pendingCount);
  const isProcessing = useSyncStore((s) => s.isProcessing);
  const isBackendAvailable = useSyncStore((s) => s.isBackendAvailable);

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

      <NetworkIndicator
        isOnline={isOnline}
        isBackendAvailable={isBackendAvailable}
        pendingCount={pendingCount}
        isProcessing={isProcessing}
      />

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
          <DropdownMenu.Item>Mi cuenta</DropdownMenu.Item>
          <DropdownMenu.Item>Configuración</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item color="red" onClick={logout}>
            Cerrar sesión
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </header>
  );
}
