import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { POSPage } from "@/pages/POSPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { CashRegisterPage } from "@/pages/CashRegisterPage";
import { TasksPage } from "@/pages/TasksPage";
import { ProductManagementPage } from "@/pages/ProductManagementPage";

export function App() {
  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<POSPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/cash-register" element={<CashRegisterPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/products-management" element={<ProductManagementPage />} />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
