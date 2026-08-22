import type { Metadata } from "next";
import { TRPCProvider } from "@/trpc/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcom Admin Panel",
  description: "Panel de administración de Arsian",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
