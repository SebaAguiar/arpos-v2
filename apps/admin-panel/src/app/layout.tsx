import type { Metadata } from "next";
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
        <div className="flex min-h-screen">
          <aside className="w-64 border-r" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Arcom Admin</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Panel de administración</p>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <a
                    href="/"
                    className="block rounded-lg px-3 py-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/clients"
                    className="block rounded-lg px-3 py-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Clientes
                  </a>
                </li>
                <li>
                  <a
                    href="/licenses"
                    className="block rounded-lg px-3 py-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Licencias
                  </a>
                </li>
                <li>
                  <a
                    href="/payments"
                    className="block rounded-lg px-3 py-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Pagos
                  </a>
                </li>
                <li>
                  <a
                    href="/support"
                    className="block rounded-lg px-3 py-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Soporte
                  </a>
                </li>
              </ul>
            </nav>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
