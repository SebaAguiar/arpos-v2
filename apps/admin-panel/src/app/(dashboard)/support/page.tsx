"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Heading, Table, Badge, Flex, Text, Select, Button } from "@radix-ui/themes";

const STATUS_OPTIONS = ["", "open", "in_progress", "resolved", "closed"] as const;
const PRIORITY_OPTIONS = ["", "low", "medium", "high", "urgent"] as const;

function badgeColor(status: string, priority: string) {
  if (status === "resolved" || status === "closed") return "green";
  if (priority === "urgent" || priority === "high") return "red";
  return "gray";
}

export default function SupportPage() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();

  const { data, isLoading } = api.support.list.useQuery({
    status: status || undefined,
    priority: priority || undefined,
    limit: 20,
    cursor,
  });

  return (
    <>
      <Heading size="6" mb="4">Soporte</Heading>

      <Flex gap="3" mb="4">
        <Select.Root value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setCursor(undefined); }}>
          <Select.Trigger placeholder="Estado" />
          <Select.Content>
            <Select.Item value="all">Todos los estados</Select.Item>
            <Select.Item value="open">Abierto</Select.Item>
            <Select.Item value="in_progress">En progreso</Select.Item>
            <Select.Item value="resolved">Resuelto</Select.Item>
            <Select.Item value="closed">Cerrado</Select.Item>
          </Select.Content>
        </Select.Root>

        <Select.Root value={priority} onValueChange={(v) => { setPriority(v === "all" ? "" : v); setCursor(undefined); }}>
          <Select.Trigger placeholder="Prioridad" />
          <Select.Content>
            <Select.Item value="all">Todas las prioridades</Select.Item>
            <Select.Item value="low">Baja</Select.Item>
            <Select.Item value="medium">Media</Select.Item>
            <Select.Item value="high">Alta</Select.Item>
            <Select.Item value="urgent">Urgente</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Asunto</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Cliente</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Prioridad</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Creado</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row><Table.Cell colSpan={5}><Text color="gray" align="center">Cargando...</Text></Table.Cell></Table.Row>
          ) : data?.items.length === 0 ? (
            <Table.Row><Table.Cell colSpan={5}><Text color="gray" align="center">No hay tickets</Text></Table.Cell></Table.Row>
          ) : (
            data?.items.map((ticket) => (
              <Table.Row key={ticket.id}>
                <Table.Cell><Text weight="medium">{ticket.subject}</Text></Table.Cell>
                <Table.Cell>
                  <Text color="gray">{ticket.client.name}</Text>
                  <Text size="1" color="gray">{ticket.client.email}</Text>
                </Table.Cell>
                <Table.Cell><Badge color={badgeColor(ticket.status, ticket.priority)} variant="soft">{ticket.status}</Badge></Table.Cell>
                <Table.Cell><Text size="1" color="gray" style={{ textTransform: "uppercase" }}>{ticket.priority}</Text></Table.Cell>
                <Table.Cell><Text color="gray">{new Date(ticket.createdAt).toLocaleDateString("es-AR")}</Text></Table.Cell>
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
