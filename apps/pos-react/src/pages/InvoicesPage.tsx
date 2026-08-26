import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InvoiceListDialog } from "@/components/sales/InvoiceListDialog";
import { useArcaStore } from "@/stores/arca.store";

export function InvoicesPage() {
  const navigate = useNavigate();
  const fetchConfig = useArcaStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <InvoiceListDialog
      open={true}
      onClose={() => navigate("/")}
    />
  );
}
