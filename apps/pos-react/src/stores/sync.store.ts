import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SyncService } from "@/services/sync.service";
import type {
  SubscriptionInfo,
  PullResult,
  SyncConfigInfo,
  SyncConfigInput,
} from "@/lib/types";

interface SyncState {
  pendingCount: number;
  syncedCount: number;
  failedCount: number;
  isProcessing: boolean;
  isPulling: boolean;
  isBackendAvailable: boolean;
  lastSyncAt: number | null;
  subscription: SubscriptionInfo | null;
  lastPullResult: PullResult | null;
  cloudConfig: SyncConfigInfo | null;
  pollingTimer: ReturnType<typeof setInterval> | null;

  fetchStatus: () => Promise<void>;
  processPending: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  saveConfig: (input: SyncConfigInput) => Promise<void>;
  disconnect: () => Promise<void>;
  startPolling: (ms?: number) => void;
  stopPolling: () => void;
  setSubscription: (info: SubscriptionInfo) => void;
  clearSubscription: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendingCount: 0,
      syncedCount: 0,
      failedCount: 0,
      isProcessing: false,
      isPulling: false,
      isBackendAvailable: true,
      lastSyncAt: null,
      subscription: null,
      lastPullResult: null,
      cloudConfig: null,
      pollingTimer: null,

      fetchStatus: async () => {
        try {
          const status = await SyncService.getStatus();
          set({
            pendingCount: status.pending,
            syncedCount: status.synced,
            failedCount: status.error,
            lastSyncAt: status.lastSyncedAt ? status.lastSyncedAt * 1000 : null,
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
          const result = await SyncService.processPending();
          set({ lastSyncAt: Date.now() });
          if (result.failed > 0) {
            console.warn(`[Sync] ${result.failed} items failed to sync`);
          }
          await get().fetchStatus();
        } finally {
          set({ isProcessing: false });
        }
      },

      pullFromCloud: async () => {
        const { isPulling } = get();
        if (isPulling) return;

        set({ isPulling: true, lastPullResult: null });
        try {
          const result = await SyncService.pullFromCloud();
          set({ lastPullResult: result, lastSyncAt: Date.now() });
          await get().fetchStatus();
        } catch (error) {
          console.error("[Sync] Pull failed:", error);
          throw error;
        } finally {
          set({ isPulling: false });
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

      setSubscription: (info) => set({ subscription: info }),

      clearSubscription: () => set({ subscription: null }),

      fetchConfig: async () => {
        try {
          const config = await SyncService.getConfig();
          set({ cloudConfig: config, isBackendAvailable: true });
          if (config.subscription) {
            const { status, tier, expiresAt } = config.subscription;
            set({
              subscription: {
                status,
                tier,
                expiresAt,
                cloudUrl: config.cloud_url ?? undefined,
              },
            });
          }
        } catch {
          set({ isBackendAvailable: false });
        }
      },

      saveConfig: async (input) => {
        const config = await SyncService.saveConfig(input);
        set({ cloudConfig: config });
        if (config.subscription) {
          const { status, tier, expiresAt } = config.subscription;
          set({
            subscription: {
              status,
              tier,
              expiresAt,
              cloudUrl: config.cloud_url ?? input.cloud_url,
              cloudJwt: input.cloud_jwt,
            },
          });
        }
        await get().processPending();
      },

      disconnect: async () => {
        await SyncService.disconnect();
        set({ cloudConfig: null, subscription: null });
      },
    }),
    {
      name: "arcom-sync",
      partialize: (state) => ({
        subscription: state.subscription,
      }),
    },
  ),
);
