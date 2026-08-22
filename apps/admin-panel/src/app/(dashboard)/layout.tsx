import "../globals.css";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Arcom Admin</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Panel de administracion</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/" className="block rounded-lg px-3 py-2 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/clients" className="block rounded-lg px-3 py-2 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                Clientes
              </Link>
            </li>
            <li>
              <Link href="/licenses" className="block rounded-lg px-3 py-2 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                Licencias
              </Link>
            </li>
            <li>
              <Link href="/payments" className="block rounded-lg px-3 py-2 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                Pagos
              </Link>
            </li>
            <li>
              <Link href="/support" className="block rounded-lg px-3 py-2 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                Soporte
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
