"use client";

import { api } from "@/trpc/react";
import { Grid, Card, Heading, Text, Flex, Badge } from "@radix-ui/themes";
import {
  PersonIcon,
  LockClosedIcon,
  BarChartIcon,
  RocketIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(cents / 100);
}

export default function DashboardPage() {
  const { data: stats, isLoading } = api.stats.overview.useQuery();

  if (isLoading) {
    return (
      <>
        <Heading size="6" mb="4">Dashboard</Heading>
        <Grid columns="3" gap="4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} style={{ opacity: 0.5 }}>
              <div style={{ height: 20, width: 80, background: "var(--gray-6)", borderRadius: 4 }} />
              <div style={{ height: 32, width: 60, background: "var(--gray-6)", borderRadius: 4, marginTop: 8 }} />
            </Card>
          ))}
        </Grid>
      </>
    );
  }

  const CARDS = [
    { label: "Clientes", value: stats?.totalClients ?? 0, icon: PersonIcon, color: "blue" as const },
    { label: "Suscripciones activas", value: stats?.activeSubscriptions ?? 0, icon: LockClosedIcon, color: "green" as const },
    { label: "Total suscripciones", value: stats?.totalSubscriptions ?? 0, icon: BarChartIcon, color: "purple" as const },
    { label: "Ingresos totales", value: formatCents(stats?.totalRevenue ?? 0), icon: CoinIcon, color: "yellow" as const },
    { label: "Tickets abiertos", value: stats?.openTickets ?? 0, icon: QuestionMarkCircledIcon, color: "red" as const },
    { label: "Proyectos", value: stats?.totalProjects ?? 0, icon: RocketIcon, color: "teal" as const },
  ];

  return (
    <>
      <Heading size="6" mb="4">Dashboard</Heading>
      <Grid columns="3" gap="4">
        {CARDS.map((card) => (
          <Card key={card.label}>
            <Flex align="center" gap="3">
              <Badge color={card.color} variant="soft" size="3">
                <card.icon style={{ width: 16, height: 16 }} />
              </Badge>
              <Flex direction="column">
                <Text size="1" color="gray">{card.label}</Text>
                <Text size="5" weight="bold">{card.value}</Text>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Grid>
    </>
  );
}

function CoinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7.5 0C7.5 0 7.24997 0.855861 7.24997 1.5C7.24997 2.14414 7.49997 3 7.49997 3C7.49997 3 7.24997 2.35586 7.24997 1.71172C7.24997 1.06758 7.5 0 7.5 0ZM7.5 15C7.5 15 7.24997 14.1441 7.24997 13.5C7.24997 12.8559 7.49997 12 7.49997 12C7.49997 12 7.24997 12.6441 7.24997 13.2883C7.24997 13.9324 7.5 15 7.5 15Z" fill="currentColor"/>
    </svg>
  );
}
