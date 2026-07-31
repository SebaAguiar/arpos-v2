import { apiClient } from "./api-client";
import type {
  SyncStatus,
  ProcessResult,
  PullResult,
  SyncConfigInfo,
  SyncConfigInput,
} from "@/lib/types";

export const SyncService = {
  getStatus: () => apiClient.get<SyncStatus>("/sync/status"),

  processPending: () => apiClient.post<ProcessResult>("/sync/process"),

  pullFromCloud: () => apiClient.post<PullResult>("/sync/pull"),

  getConfig: () => apiClient.get<SyncConfigInfo>("/sync/config"),

  saveConfig: (input: SyncConfigInput) =>
    apiClient.post<SyncConfigInfo>("/sync/config", input),

  disconnect: () => apiClient.post<{ ok: true }>("/sync/disconnect"),

  reconnect: () => apiClient.post<{ pulled: number; applied: number; skipped: number; errors: string[] }>("/sync/reconnect"),
};
