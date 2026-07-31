import { invoke } from "@tauri-apps/api/core";
import type { ExportResult } from "@/lib/types";

export const ExportService = {
  async toSql(outputPath?: string): Promise<ExportResult> {
    return invoke<ExportResult>("export_to_sql", outputPath ? { outputPath } : undefined);
  },

  async toJson(outputPath?: string): Promise<ExportResult> {
    return invoke<ExportResult>("export_to_json", outputPath ? { outputPath } : undefined);
  },
};
