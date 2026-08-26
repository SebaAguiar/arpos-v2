"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Heading, Table, Badge, Flex, Text, Select, Button, TextField } from "@radix-ui/themes";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";


function badgeColor(s: string) {
  if (s === "active") return "green";
  if (s === "canceled") return "red";
  return "gray";
}

export default function LicensesPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = api.subscriptions.list.useQuery({
    status: status || undefined,
    search: search || undefined,
    limit: 15,
    cursor,
  });

  return (
    <>
      <Heading size="6" mb="4">Licencias</Heading>

      <Flex gap="3" mb="4">
        <TextField.Root
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCursor(undefined); }}
          style={{ maxWidth: 300 }}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon height="16" width="16" />
          </TextField.Slot>
        </TextField.Root>

        <Select.Root value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setCursor(undefined); }}>
          <Select.Trigger placeholder="Estado" />
          <Select.Content>
            <Select.Item value="all">Todos los estados</Select.Item>
            <Select.Item value="active">Activo</Select.Item>
            <Select.Item value="trialing">Trial</Select.Item>
            <Select.Item value="past_due">Vencido</Select.Item>
            <Select.Item value="canceled">Cancelado</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Cliente</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Producto</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Plan</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Tiendas</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Renovacion</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row><Table.Cell colSpan={6}><Text color="gray" align="center">Cargando...</Text></Table.Cell></Table.Row>
          ) : data?.items.length === 0 ? (
            <Table.Row><Table.Cell colSpan={6}><Text color="gray" align="center">No hay suscripciones</Text></Table.Cell></Table.Row>
          ) : (
            data?.items.map((sub) => (
              <Table.Row key={sub.id}>
                <Table.Cell>
                  <Text weight="medium">{sub.client.name}</Text>
                  <Text size="1" color="gray">{sub.client.email}</Text>
                </Table.Cell>
                <Table.Cell><Text color="gray">{sub.product.name}</Text></Table.Cell>
                <Table.Cell><Text color="gray">{sub.plan.name}</Text></Table.Cell>
                <Table.Cell><Badge color={badgeColor(sub.status)} variant="soft">{sub.status}</Badge></Table.Cell>
                <Table.Cell><Text color="gray">{sub.maxStoresOverride ?? sub.plan.maxStoresDefault}</Text></Table.Cell>
                <Table.Cell><Text color="gray">{sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString("es-AR") : "-"}</Text></Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table.Root>

      {data?.nextCursor && (
        <Flex justify="center" mt="4">
          <Button variant="soft" onClick={() => setCursor(data.nextCursor)}>Cargar mas</Button>
        </Flex>
      )}
    </>
  );
}
