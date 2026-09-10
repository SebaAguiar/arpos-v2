import { useEffect } from "react";
import { Text, Card, Badge } from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  FileTextIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useArcaStore } from "@/stores/arca.store";
import { formatCents } from "@/lib/currency";

function StatCard({
  label,
  value,
  valueExtra,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  valueExtra?: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "14px",
        backgroundColor: `${color}08`,
        border: `1px solid ${color}22`,
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          backgroundColor: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <Text size="1" color="gray" style={{ display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Text size="3" weight="bold" style={{ display: "block" }}>
            {value}
          </Text>
          {valueExtra}
        </div>
      </div>
    </div>
  );
}

export function FiscalDashboard() {
  const { stats, isLoadingStats, fetchStats, isRetrying, retryFailed, config } = useArcaStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileTextIcon width={16} height={16} />
          <Text size="3" weight="bold">Panel Fiscal</Text>
        </div>
        {config && (
          <button
            onClick={async () => {
              try {
                await retryFailed();
              } catch {
                // error handled in store
              }
            }}
            disabled={isRetrying || !stats || stats.error === 0}
            style={{
              padding: "5px 12px",
              borderRadius: "8px",
              border: "1px solid var(--gray-a4)",
              backgroundColor: isRetrying || !stats || stats.error === 0 ? "var(--gray-a2)" : "rgba(139, 92, 246, 0.06)",
              color: isRetrying || !stats || stats.error === 0 ? "var(--gray-9)" : "var(--accent)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: isRetrying || !stats || stats.error === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {isRetrying ? (
              <ReloadIcon width={12} height={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <ReloadIcon width={12} height={12} />
            )}
            Reintentar fallidas
          </button>
        )}
      </div>

      {isLoadingStats ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", color: "var(--text-muted)" }}>
          <ReloadIcon width={14} height={14} style={{ animation: "spin 1s linear infinite", marginRight: "8px" }} />
          Cargando estadísticas...
        </div>
      ) : !stats ? (
        <Text size="2" color="gray" style={{ display: "block", textAlign: "center", padding: "20px" }}>
          No se pudieron cargar las estadísticas
        </Text>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <StatCard
            label="Total"
            value={stats.total}
            icon={<FileTextIcon width={16} height={16} color="#8b5cf6" />}
            color="#8b5cf6"
          />
          <StatCard
            label="Emitidos"
            value={stats.issued}
            valueExtra={
              <Badge size="1" color="green" variant="soft">
                {formatCents(stats.issuedAmountCents)}
              </Badge>
            }
            icon={<CheckCircledIcon width={16} height={16} color="#2db464" />}
            color="#2db464"
          />
          <StatCard
            label="Pendientes"
            value={stats.pending}
            icon={<FileTextIcon width={16} height={16} color="#e6a817" />}
            color="#e6a817"
          />
          <StatCard
            label="Con error"
            value={stats.error}
            icon={<CrossCircledIcon width={16} height={16} color="#ef4444" />}
            color="#ef4444"
          />
        </div>
      )}
    </Card>
  );
}
