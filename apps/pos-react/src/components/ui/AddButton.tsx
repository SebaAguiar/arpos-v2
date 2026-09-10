import { Button } from "@radix-ui/themes";
import { PlusIcon } from "@radix-ui/react-icons";
import { KbdShortcut } from "@/components/ui/KbdShortcut";

interface AddButtonProps {
  label: string;
  onClick: () => void;
  size?: "1" | "2" | "3";
  shortcut?: string;
}

export function AddButton({ label, onClick, size = "2", shortcut }: AddButtonProps) {
  return (
    <Button
      size={size}
      onClick={onClick}
      aria-label={shortcut ? `${label} (Presioná ${shortcut.toUpperCase()})` : undefined}
    >
      <PlusIcon width={size === "3" ? 18 : 16} height={size === "3" ? 18 : 16} />
      {label}
      {shortcut && <KbdShortcut label={shortcut.toUpperCase()} />}
    </Button>
  );
}