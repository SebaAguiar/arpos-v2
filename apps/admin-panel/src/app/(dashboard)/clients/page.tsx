"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import Link from "next/link";
import { Heading, Button, TextField, Table, Badge, Flex, Text } from "@radix-ui/themes";
import { PlusIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const { data, isLoading } = api.clients.list.useQuery({ search, limit: 15, cursor });

  return (
    <>
      <Flex justify="between" align="center" mb="4">
        <Heading size="6">Clientes</Heading>
        <Link href="/clients/new" style={{ textDecoration: "none" }}>
          <Button size="2">
            <PlusIcon /> Nuevo cliente
          </Button>
        </Link>
      </Flex>

      <TextField.Root
        placeholder="Buscar por nombre, email o empresa..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setCursor(undefined); }}
        mb="4"
        style={{ maxWidth: 400 }}
      >
        <TextField.Slot>
          <MagnifyingGlassIcon height="16" width="16" />
        </TextField.Slot>
      </TextField.Root>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Nombre</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Empresa</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Creado</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Acciones</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {isLoading ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <Text color="gray" align="center">Cargando...</Text>
              </Table.Cell>
            </Table.Row>
          ) : data?.items.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <Text color="gray" align="center">No hay clientes</Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            data?.items.map((client) => (
              <Table.Row key={client.id}>
                <Table.Cell><Text weight="medium">{client.name}</Text></Table.Cell>
                <Table.Cell><Text color="gray">{client.email}</Text></Table.Cell>
                <Table.Cell>
                  <Badge color={client.type === "empresa" ? "blue" : "gray"} variant="soft">
                    {client.type}
                  </Badge>
                </Table.Cell>
                <Table.Cell><Text color="gray">{client.company ?? "-"}</Text></Table.Cell>
                <Table.Cell><Text color="gray">{new Date(client.createdAt).toLocaleDateString("es-AR")}</Text></Table.Cell>
                <Table.Cell>
                  <Link href={`/clients/${client.id}`} style={{ textDecoration: "none" }}>
                    <Button variant="ghost" size="1">Ver</Button>
                  </Link>
                </Table.Cell>
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
