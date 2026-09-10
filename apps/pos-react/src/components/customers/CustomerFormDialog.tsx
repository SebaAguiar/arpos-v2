import { useState, useCallback } from "react";
import {
  Dialog,
  Button,
  TextField,
  Flex,
  Grid,
} from "@radix-ui/themes";
import { ContactsRepository } from "@/repositories/contacts.repository";
import type { Customer } from "@/lib/types";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { InlineNotice } from "@/components/ui/InlineNotice";

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerToEdit?: Customer | null;
  onSuccess: () => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customerToEdit,
  onSuccess,
}: CustomerFormDialogProps) {
  const isEditing = !!customerToEdit;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setError(null);
      if (customerToEdit) {
        setName(customerToEdit.name);
        setEmail(customerToEdit.email ?? "");
        setPhone(customerToEdit.phone ?? "");
        setAddress(customerToEdit.address ?? "");
        setTaxId(customerToEdit.taxId ?? "");
      } else {
        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setTaxId("");
      }
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!name.trim()) {
        setError("El nombre del cliente es obligatorio.");
        return;
      }

      setSubmitting(true);
      try {
        if (isEditing && customerToEdit) {
          await ContactsRepository.update(customerToEdit.id, {
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            tax_id: taxId.trim() || undefined,
          });
        } else {
          await ContactsRepository.create({
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            tax_id: taxId.trim() || undefined,
          });
        }
        onSuccess();
        onOpenChange(false);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al guardar el cliente.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [name, email, phone, address, taxId, isEditing, customerToEdit, onSuccess, onOpenChange],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 480, padding: "24px" }}>
        <Dialog.Title style={{ marginBottom: "4px" }}>
          {isEditing ? "Editar cliente" : "Nuevo cliente"}
        </Dialog.Title>
        <Dialog.Description size="2" color="gray" style={{ marginBottom: "16px" }}>
          {isEditing
            ? "Modificá los datos del cliente."
            : "Completá la información para registrar un nuevo cliente."}
        </Dialog.Description>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {error && (
              <InlineNotice>{error}</InlineNotice>
            )}

            <div>
              <FieldLabel size="1" marginBottom="4px">
                Nombre *
              </FieldLabel>
              <TextField.Root
                placeholder="Nombre del cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Nombre del cliente"
              />
            </div>

            <Grid columns="2" gap="3">
              <div>
                <FieldLabel size="1" marginBottom="4px">
                  Email
                </FieldLabel>
                <TextField.Root
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-label="Email del cliente"
                />
              </div>
              <div>
                <FieldLabel size="1" marginBottom="4px">
                  Teléfono
                </FieldLabel>
                <TextField.Root
                  placeholder="Ej. 11 1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-label="Teléfono del cliente"
                />
              </div>
            </Grid>

            <div>
              <FieldLabel size="1" marginBottom="4px">
                Dirección
              </FieldLabel>
              <TextField.Root
                placeholder="Calle, número, localidad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-label="Dirección del cliente"
              />
            </div>

            <div>
              <FieldLabel size="1" marginBottom="4px">
                CUIT / Documento
              </FieldLabel>
              <TextField.Root
                placeholder="Ej. 20-12345678-9"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                aria-label="CUIT o documento del cliente"
              />
            </div>

            <Flex justify="end" gap="3" style={{ marginTop: "16px" }}>
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Guardando..."
                  : isEditing
                  ? "Guardar cambios"
                  : "Crear cliente"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
