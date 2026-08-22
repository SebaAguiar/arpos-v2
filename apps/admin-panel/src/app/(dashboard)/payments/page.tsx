"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Heading, Table, Badge, Flex, Text, Select, Button } from "@radix-ui/themes";

const STATUS_OPTIONS = ["", "completed", "pending", "failed", "refunded"] as const;

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);
}

function badgeColor(s: string) {
  if (s === "completed") return "green";
  if (s === "failed" || s === "refunded") return "red";
  return "gray";
}

export default function PaymentsPage() {
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = api.payments.list.useQuery({
    status: status || undefined,
    limit: 20,
    cursor,
  });

  return (
    <>
      <Heading size="6" mb="4">Pagos</Heading>

      <Flex gap="3" mb="4">
        <Select.Root value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setCursor(undefined); }}>
          <Select.Trigger placeholder="Estado" />
          <Select.Content>
            <Select.Item value="all">Todos los estados</Select.Item>
            <Select.Item value="completed">Completado</Select.Item>
            <Select.Item value="pending">Pendiente</Select.Item>
            <Select.Item value="failed">Fallido</Select.Item>
            <Select.Item value="refunded">Reembolsado</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Cliente</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Monto</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Metodo</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Referencia</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Fecha</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row><Table.Cell colSpan={6}><Text color="gray" align="center">Cargando...</Text></Table.Cell></Table.Row>
          ) : data?.items.length === 0 ? (
            <Table.Row><Table.Cell colSpan={6}><Text color="gray" align="center">No hay pagos</Text></Table.Cell></Table.Row>
          ) : (
            data?.items.map((payment) => (
              <Table.Row key={payment.id}>
                <Table.Cell>
                  <Text weight="medium">{payment.client.name}</Text>
                  <Text size="1" color="gray">{payment.client.email}</Text>
                </Table.Cell>
                <Table.Cell><Text weight="medium">{formatCents(payment.amountCents)}</Text></Table.Cell>
                <Table.Cell><Badge color={badgeColor(payment.status)} variant="soft">{payment.status}</Badge></Table.Cell>
                <Table.Cell><Text color="gray">{payment.method ?? "-"}</Text></Table.Cell>
                <Table.Cell><Text size="1" color="gray" style={{ fontFamily: "monospace" }}>{payment.externalRef ?? "-"}</Text></Table.Cell>
                <Table.Cell><Text color="gray">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("es-AR") : "-"}</Text></Table.Cell>
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
