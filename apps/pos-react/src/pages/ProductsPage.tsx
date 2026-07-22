import { Text, Button, Table, Badge, IconButton } from "@radix-ui/themes";
import { PlusIcon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";

export function ProductsPage() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <Text size="5" weight="bold">Productos</Text>
        <Button size="2">
          <PlusIcon width={16} height={16} />
          Nuevo producto
        </Button>
      </div>

      <div style={{ backgroundColor: "#1a1a1a", borderRadius: "8px", border: "1px solid #2a2a2a", overflow: "hidden" }}>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nombre</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Precio</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Stock</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Acciones</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Remera Básica</Table.Cell>
              <Table.Cell>$2.500</Table.Cell>
              <Table.Cell>15</Table.Cell>
              <Table.Cell><Badge color="green" variant="soft">Activo</Badge></Table.Cell>
              <Table.Cell>
                <div style={{ display: "flex", gap: "4px" }}>
                  <IconButton size="1" variant="ghost"><Pencil2Icon width={14} height={14} /></IconButton>
                  <IconButton size="1" variant="ghost" color="red"><TrashIcon width={14} height={14} /></IconButton>
                </div>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </div>
    </div>
  );
}
