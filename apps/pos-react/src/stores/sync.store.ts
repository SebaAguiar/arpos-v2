import { create } from "zustand";
import { SyncService } from "@/services/sync.service";

interface SyncState {
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  isProcessing: boolean;
  isBackendAvailable: boolean;
  lastSyncAt: number | null;
  pollingTimer: ReturnType<typeof setInterval> | null;

  fetchStatus: () => Promise<void>;
  processPending: () => Promise<void>;
  startPolling: (ms?: number) => void;
  stopPolling: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingCount: 0,
  syncedCount: 0,
  failedCount: 0,
  isProcessing: false,
  isBackendAvailable: true,
  lastSyncAt: null,
  pollingTimer: null,

  fetchStatus: async () => {
    try {
      const status = await SyncService.getStatus();
      set({
        pendingCount: status.pending,
        syncedCount: status.synced,
        failedCount: status.failed,
        isBackendAvailable: true,
      });
    } catch {
      set({ pendingCount: 0, isBackendAvailable: false });
    }
  },

  processPending: async () => {
    const { isProcessing } = get();
    if (isProcessing) return;

    set({ isProcessing: true });
    try {
      await SyncService.processPending();
      set({ lastSyncAt: Date.now() });
      await get().fetchStatus();
    } finally {
      set({ isProcessing: false });
    }
  },

  startPolling: (ms = 30_000) => {
    const { pollingTimer } = get();
    if (pollingTimer) return;

    get().fetchStatus();
    const timer = setInterval(() => {
      get().fetchStatus();
    }, ms);
    set({ pollingTimer: timer });
  },

  stopPolling: () => {
    const { pollingTimer } = get();
    if (pollingTimer) {
      clearInterval(pollingTimer);
      set({ pollingTimer: null });
    }
  },
}));
