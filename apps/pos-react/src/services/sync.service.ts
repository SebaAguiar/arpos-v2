import { apiClient } from "./api-client";
import type { SyncStatus, ProcessResult, PullResult } from "@/lib/types";

export const SyncService = {
  getStatus: () => apiClient.get<SyncStatus>("/sync/status"),

  processPending: () => apiClient.post<ProcessResult>("/sync/process"),

  pullFromCloud: () => apiClient.post<PullResult>("/sync/pull"),
};
