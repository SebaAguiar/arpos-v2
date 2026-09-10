import { type ReactNode, type ComponentType } from "react";
import { Table, Flex, Text, Button } from "@radix-ui/themes";
import { ArchiveIcon } from "@radix-ui/react-icons";

type IconProps = { width?: number; height?: number; color?: string };

interface EmptyStateProps {
  colSpan: number;
  title: string;
  description: string | ReactNode;
  icon?: ComponentType<IconProps>;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  colSpan,
  title,
  description,
  icon: Icon = ArchiveIcon,
  action,
}: EmptyStateProps) {
  return (
    <Table.Row>
      <Table.Cell colSpan={colSpan}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="3"
          style={{ padding: "48px 16px", textAlign: "center" }}
        >
          <Icon width={36} height={36} color="var(--text-muted)" />
          <Text size="3" weight="bold" color="gray">
            {title}
          </Text>
          <Text size="2" color="gray" style={{ maxWidth: 400 }}>
            {description}
          </Text>
          {action && (
            <Button size="2" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}