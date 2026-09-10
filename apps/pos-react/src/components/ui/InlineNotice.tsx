import { type CSSProperties, type ReactNode } from "react";
import { Text } from "@radix-ui/themes";
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

type InlineNoticeTone = "error" | "warning" | "success";

interface InlineNoticeProps {
  children: ReactNode;
  tone?: InlineNoticeTone;
  bordered?: boolean;
  icon?: boolean;
  action?: ReactNode;
  style?: CSSProperties;
}

const toneStyles: Record<
  InlineNoticeTone,
  { bg: string; color: string; icon: typeof ExclamationTriangleIcon }
> = {
  error: {
    bg: "var(--color-danger-subtle)",
    color: "var(--color-danger)",
    icon: ExclamationTriangleIcon,
  },
  warning: {
    bg: "var(--color-warning-subtle)",
    color: "var(--color-warning)",
    icon: ExclamationTriangleIcon,
  },
  success: {
    bg: "var(--color-success-subtle)",
    color: "var(--color-success)",
    icon: CheckCircledIcon,
  },
};

const textColors: Record<InlineNoticeTone, "red" | "orange" | "green"> = {
  error: "red",
  warning: "orange",
  success: "green",
};

export function InlineNotice({
  children,
  tone = "error",
  bordered = true,
  icon = true,
  action,
  style,
}: InlineNoticeProps) {
  const t = toneStyles[tone];
  const Icon = t.icon;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 12px",
        backgroundColor: t.bg,
        borderRadius: "6px",
        border: bordered ? `1px solid ${t.color}` : undefined,
        ...style,
      }}
    >
      {icon && (
        <span style={{ display: "flex", flexShrink: 0 }}>
          <Icon width={16} height={16} color={t.color} />
        </span>
      )}
      <Text size="2" color={textColors[tone]} style={{ flex: 1 }}>
        {children}
      </Text>
      {action}
    </div>
  );
}