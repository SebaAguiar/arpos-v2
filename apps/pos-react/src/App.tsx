import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { POSPage } from "@/pages/POSPage";

const ProductsPage = lazy(() =>
  import("@/pages/ProductsPage").then((m) => ({ default: m.ProductsPage }))
);
const InventoryPage = lazy(() =>
  import("@/pages/InventoryPage").then((m) => ({ default: m.InventoryPage }))
);
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const CashRegisterPage = lazy(() =>
  import("@/pages/CashRegisterPage").then((m) => ({ default: m.CashRegisterPage }))
);
const TasksPage = lazy(() =>
  import("@/pages/TasksPage").then((m) => ({ default: m.TasksPage }))
);
const ProductManagementPage = lazy(() =>
  import("@/pages/ProductManagementPage").then((m) => ({
    default: m.ProductManagementPage,
  }))
);
const CustomersPage = lazy(() =>
  import("@/pages/CustomersPage").then((m) => ({ default: m.CustomersPage }))
);
const PurchasesPage = lazy(() =>
  import("@/pages/PurchasesPage").then((m) => ({ default: m.PurchasesPage }))
);
const WalletPage = lazy(() =>
  import("@/pages/WalletPage").then((m) => ({ default: m.WalletPage }))
);
const BackupPage = lazy(() =>
  import("@/pages/BackupPage").then((m) => ({ default: m.BackupPage }))
);

function PageFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        color: "var(--text-secondary, #888)",
        fontSize: "14px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid var(--border, #333)",
            borderTopColor: "var(--accent, #3b82f6)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        Cargando...
      </div>
    </div>
  );
}

export function App() {
  return (
    <ProtectedRoute>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<POSPage />} />
          <Route
            path="/products"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProductsPage />
              </Suspense>
            }
          />
          <Route
            path="/inventory"
            element={
              <Suspense fallback={<PageFallback />}>
                <InventoryPage />
              </Suspense>
            }
          />
          <Route
            path="/customers"
            element={
              <Suspense fallback={<PageFallback />}>
                <CustomersPage />
              </Suspense>
            }
          />
          <Route
            path="/purchases"
            element={
              <Suspense fallback={<PageFallback />}>
                <PurchasesPage />
              </Suspense>
            }
          />
          <Route
            path="/wallet"
            element={
              <Suspense fallback={<PageFallback />}>
                <WalletPage />
              </Suspense>
            }
          />
          <Route
            path="/reports"
            element={
              <Suspense fallback={<PageFallback />}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<PageFallback />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route
            path="/cash-register"
            element={
              <Suspense fallback={<PageFallback />}>
                <CashRegisterPage />
              </Suspense>
            }
          />
          <Route
            path="/tasks"
            element={
              <Suspense fallback={<PageFallback />}>
                <TasksPage />
              </Suspense>
            }
          />
          <Route
            path="/products-management"
            element={
              <Suspense fallback={<PageFallback />}>
                <ProductManagementPage />
              </Suspense>
            }
          />
          <Route
            path="/settings/backup"
            element={
              <Suspense fallback={<PageFallback />}>
                <BackupPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </ProtectedRoute>
  );
}
