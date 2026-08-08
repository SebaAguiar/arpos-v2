import { safeInvoke } from "@/lib/tauri";
import type { ExportResult } from "@/lib/types";

export const ExportService = {
  async toSql(outputPath?: string): Promise<ExportResult> {
    return safeInvoke<ExportResult>("export_to_sql", outputPath ? { outputPath } : undefined);
  },

  async toJson(outputPath?: string): Promise<ExportResult> {
    return safeInvoke<ExportResult>("export_to_json", outputPath ? { outputPath } : undefined);
  },
};
