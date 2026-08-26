"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Heading, Card, Badge, Flex, Text, Table, Button } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);
}

function badgeColor(s: string) {
  if (s === "active") return "green";
  if (s === "canceled" || s === "failed") return "red";
  return "gray";
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: client, isLoading } = api.clients.getById.useQuery({ id });

  if (isLoading) {
    return <div style={{ opacity: 0.5 }}>Cargando...</div>;
  }

  if (!client) {
    return (
      <Flex direction="column" gap="4">
        <Text color="gray">Cliente no encontrado</Text>
        <Link href="/clients" style={{ textDecoration: "none" }}>
          <Button variant="ghost" size="2"><ArrowLeftIcon /> Volver a clientes</Button>
        </Link>
      </Flex>
    );
  }

  return (
    <>
      <Link href="/clients" style={{ textDecoration: "none" }}>
        <Button variant="ghost" size="2" mb="4"><ArrowLeftIcon /> Volver a clientes</Button>
      </Link>

      <Flex justify="between" align="center" mb="4">
        <Flex direction="column">
          <Heading size="6">{client.name}</Heading>
          <Text color="gray">{client.email}</Text>
        </Flex>
        <Badge color={client.type === "empresa" ? "blue" : "gray"} variant="soft" size="2">{client.type}</Badge>
      </Flex>

      <Card mb="4">
        <Heading size="3" mb="3">Informacion</Heading>
        <Flex direction="column" gap="2">
          <InfoRow label="Empresa" value={client.company} />
          <InfoRow label="Telefono" value={client.phone} />
          <InfoRow label="Tax ID" value={client.taxId} />
          <InfoRow label="Pais" value={client.country} />
          <InfoRow label="Fuente" value={client.source} />
          <InfoRow label="Creado" value={new Date(client.createdAt).toLocaleDateString("es-AR")} />
          {client.notes && <InfoRow label="Notas" value={client.notes} />}
        </Flex>
      </Card>

      <Card mb="4">
        <Heading size="3" mb="3">Suscripciones ({client.subscriptions.length})</Heading>
        {client.subscriptions.length === 0 ? (
          <Text color="gray" size="2">Sin suscripciones</Text>
        ) : (
          <Table.Root variant="surface" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Producto</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Plan</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Renovacion</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {client.subscriptions.map((sub) => (
                <Table.Row key={sub.id}>
                  <Table.Cell><Text color="gray">{sub.product?.name ?? sub.productId}</Text></Table.Cell>
                  <Table.Cell><Text color="gray">{sub.plan?.name ?? sub.planId}</Text></Table.Cell>
                  <Table.Cell><Badge color={badgeColor(sub.status)} variant="soft">{sub.status}</Badge></Table.Cell>
                  <Table.Cell><Text color="gray">{sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString("es-AR") : "-"}</Text></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card>

      <Card mb="4">
        <Heading size="3" mb="3">Proyectos ({client.projects.length})</Heading>
        {client.projects.length === 0 ? (
          <Text color="gray" size="2">Sin proyectos</Text>
        ) : (
          <Table.Root variant="surface" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Nombre</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Tipo</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Presupuesto</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {client.projects.map((project) => (
                <Table.Row key={project.id}>
                  <Table.Cell><Text weight="medium">{project.name}</Text></Table.Cell>
                  <Table.Cell><Text color="gray">{project.type}</Text></Table.Cell>
                  <Table.Cell><Badge color={badgeColor(project.status)} variant="soft">{project.status}</Badge></Table.Cell>
                  <Table.Cell><Text color="gray">{project.budgetCents ? formatCents(project.budgetCents) : "-"}</Text></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card>

      <Card>
        <Heading size="3" mb="3">Pagos recientes ({client.payments.length})</Heading>
        {client.payments.length === 0 ? (
          <Text color="gray" size="2">Sin pagos</Text>
        ) : (
          <Table.Root variant="surface" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Monto</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Estado</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Metodo</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Fecha</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {client.payments.map((payment) => (
                <Table.Row key={payment.id}>
                  <Table.Cell><Text weight="medium">{formatCents(payment.amountCents)}</Text></Table.Cell>
                  <Table.Cell><Badge color={badgeColor(payment.status)} variant="soft">{payment.status}</Badge></Table.Cell>
                  <Table.Cell><Text color="gray">{payment.method ?? "-"}</Text></Table.Cell>
                  <Table.Cell><Text color="gray">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("es-AR") : "-"}</Text></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Card>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Flex gap="2">
      <Text size="2" color="gray" style={{ minWidth: 100 }}>{label}:</Text>
      <Text size="2">{value ?? "-"}</Text>
    </Flex>
  );
}
