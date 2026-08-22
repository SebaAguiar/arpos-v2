"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import {
  DashboardIcon,
  PersonIcon,
  LockClosedIcon,
  QuestionMarkCircledIcon,
  StarIcon,
} from "@radix-ui/react-icons";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/clients", label: "Clientes", icon: PersonIcon },
  { href: "/licenses", label: "Licencias", icon: LockClosedIcon },
  { href: "/payments", label: "Pagos", icon: StarIcon },
  { href: "/support", label: "Soporte", icon: QuestionMarkCircledIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Flex style={{ minHeight: "100vh" }}>
      <Box
        style={{
          width: 256,
          borderRight: "1px solid var(--gray-6)",
          background: "var(--color-surface)",
          flexShrink: 0,
        }}
      >
        <Box p="4" style={{ borderBottom: "1px solid var(--gray-6)" }}>
          <Heading size="4">Arcom Admin</Heading>
          <Text size="1" color="gray">Panel de administracion</Text>
        </Box>
        <Flex direction="column" gap="1" p="3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <Flex
                  align="center"
                  gap="2"
                  px="3"
                  py="2"
                  style={{
                    borderRadius: 6,
                    background: isActive ? "var(--accent-9)" : "transparent",
                    color: isActive ? "white" : "var(--gray-11)",
                    fontWeight: isActive ? 600 : 400,
                    transition: "background 0.15s",
                  }}
                >
                  <item.icon style={{ width: 16, height: 16 }} />
                  <Text size="2">{item.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </Flex>
      </Box>
      <Box style={{ flex: 1, padding: 32 }}>
        {children}
      </Box>
    </Flex>
  );
}
