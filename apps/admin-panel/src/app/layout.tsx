import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArPOS Admin Panel",
  description: "Admin panel for ArPOS license management",
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
          <aside className="w-64 border-r border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 p-4">
              <h1 className="text-xl font-bold text-gray-900">ArPOS Admin</h1>
              <p className="text-sm text-gray-500">Panel de administración</p>
            </div>
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <a
                    href="/"
                    className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/clients"
                    className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Clientes
                  </a>
                </li>
                <li>
                  <a
                    href="/licenses"
                    className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Licencias
                  </a>
                </li>
                <li>
                  <a
                    href="/payments"
                    className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Pagos
                  </a>
                </li>
                <li>
                  <a
                    href="/support"
                    className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
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
