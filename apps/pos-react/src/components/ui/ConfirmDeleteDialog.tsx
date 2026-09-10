import { type ReactNode } from "react";
import { Dialog, Flex, Button } from "@radix-ui/themes";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  loading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 400, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "8px" }}>{title}</Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "20px" }}>
          {description}
        </Dialog.Description>

        <Flex justify="end" gap="3">
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray">
              Cancelar
            </Button>
          </Dialog.Close>
          <Button color="red" disabled={loading} onClick={onConfirm}>
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}