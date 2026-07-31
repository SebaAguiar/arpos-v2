import { create } from "zustand";
import { SystemRepository } from "@/repositories/system.repository";
import type { DatabaseInfo, ExportResult, SystemInfo } from "@/lib/types";

interface SystemState {
  systemInfo: SystemInfo | null;
  dbInfo: DatabaseInfo | null;
  integrity: boolean | null;
  loading: boolean;
  integrityChecking: boolean;
  migrating: boolean;
  exporting: "sql" | "json" | null;
  lastExport: ExportResult | null;
  error: string | null;

  fetchInfo: () => Promise<void>;
  runIntegrityCheck: () => Promise<void>;
  runMigrations: () => Promise<void>;
  exportSql: () => Promise<void>;
  exportJson: () => Promise<void>;
  clearError: () => void;
}

export const useSystemStore = create<SystemState>()((set) => ({
  systemInfo: null,
  dbInfo: null,
  integrity: null,
  loading: false,
  integrityChecking: false,
  migrating: false,
  exporting: null,
  lastExport: null,
  error: null,

  fetchInfo: async () => {
    set({ loading: true, error: null });
    try {
      const [systemInfo, dbInfo] = await Promise.all([
        SystemRepository.getInfo(),
        SystemRepository.getDatabaseInfo(),
      ]);
      set({ systemInfo, dbInfo, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  runIntegrityCheck: async () => {
    set({ integrityChecking: true, error: null });
    try {
      const integrity = await SystemRepository.checkIntegrity();
      set({ integrity, integrityChecking: false });
    } catch (e) {
      set({ error: String(e), integrityChecking: false });
    }
  },

  runMigrations: async () => {
    set({ migrating: true, error: null });
    try {
      await SystemRepository.runMigrations();
      const dbInfo = await SystemRepository.getDatabaseInfo();
      set({ dbInfo, migrating: false });
    } catch (e) {
      set({ error: String(e), migrating: false });
    }
  },

  exportSql: async () => {
    set({ exporting: "sql", error: null });
    try {
      const lastExport = await SystemRepository.exportToSql();
      set({ lastExport, exporting: null });
    } catch (e) {
      set({ error: String(e), exporting: null });
    }
  },

  exportJson: async () => {
    set({ exporting: "json", error: null });
    try {
      const lastExport = await SystemRepository.exportToJson();
      set({ lastExport, exporting: null });
    } catch (e) {
      set({ error: String(e), exporting: null });
    }
  },

  clearError: () => set({ error: null }),
}));
