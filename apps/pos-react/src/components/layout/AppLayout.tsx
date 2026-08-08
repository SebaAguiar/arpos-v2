import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLayoutStore } from "@/stores/layout.store";
import { useSyncStore } from "@/stores/sync.store";
import { useDialogStore } from "@/stores/dialog.store";
import { useHotkeys } from "@/hooks/useHotkeys";
import { OpenRegisterModal } from "@/components/sales/OpenRegisterModal";
import { CloseRegisterModal } from "@/components/sales/CloseRegisterModal";
import { DashboardDialog } from "@/components/dashboard/DashboardDialog";
import { useCashRegisterStore } from "@/stores/cash-register.store";

export function AppLayout() {
  const navigate = useNavigate();
  const sidebarOpen = useLayoutStore((s) => s.sidebarOpen);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const startPolling = useSyncStore((s) => s.startPolling);
  const stopPolling = useSyncStore((s) => s.stopPolling);
  const isBackendAvailable = useSyncStore((s) => s.isBackendAvailable);
  const cashControl = useDialogStore((s) => s.cashControl);
  const currentShift = useCashRegisterStore((s) => s.currentShift);
  const fetchCurrentShift = useCashRegisterStore((s) => s.fetchCurrentShift);
  const dashboard = useDialogStore((s) => s.dashboard);

  useEffect(() => {
    startPolling(30_000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (isBackendAvailable) {
      void fetchCurrentShift();
    }
  }, [isBackendAvailable, fetchCurrentShift]);

  useHotkeys([{ keys: "Alt+P", handler: () => navigate("/"), allowInInput: true }]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {sidebarOpen && <Sidebar />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>

      {cashControl && (currentShift ? <CloseRegisterModal /> : <OpenRegisterModal />)}
      {dashboard && <DashboardDialog />}
    </div>
  );
}
