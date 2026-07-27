import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLayoutStore } from "@/stores/layout.store";
import { useSyncStore } from "@/stores/sync.store";

export function AppLayout() {
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const startPolling = useSyncStore((s) => s.startPolling);
  const stopPolling = useSyncStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling(30_000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {sidebarOpen && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main style={{ flex: 1, overflow: "auto", padding: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
