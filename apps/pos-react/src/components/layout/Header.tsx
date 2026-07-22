import { TextField, DropdownMenu, Avatar, IconButton, Badge, Tooltip } from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  BellIcon,
  HamburgerMenuIcon,
  Cross1Icon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { useThemeStore } from "@/stores/theme.store";

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

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

      <Badge color="green" variant="soft" size="1">
        Online
      </Badge>

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
            <Avatar size="1" radius="full" fallback="A" color="orange" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item>Mi cuenta</DropdownMenu.Item>
          <DropdownMenu.Item>Configuración</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item color="red">Cerrar sesión</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </header>
  );
}
