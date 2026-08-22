import type { Metadata } from "next";
import { TRPCProvider } from "@/trpc/provider";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcom Admin Panel",
  description: "Panel de administracion de Arsian",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <TRPCProvider>
          <Theme accentColor="indigo" grayColor="slate" radius="medium" scaling="100%">
            {children}
          </Theme>
        </TRPCProvider>
      </body>
    </html>
  );
}
