import { apiClient } from "./api-client";
import type { SyncStatus } from "@/lib/types";

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

export const SyncService = {
  getStatus: () => apiClient.get<SyncStatus>("/sync/status"),

  processPending: () => apiClient.post<ProcessResult>("/sync/process"),
};
