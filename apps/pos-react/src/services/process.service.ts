import { safeInvoke } from "@/lib/tauri";
import type { BackendStatus } from "@/lib/types";

export const ProcessService = {
  async start(): Promise<string> {
    return safeInvoke<string>("start_backend");
  },

  async stop(): Promise<string> {
    return safeInvoke<string>("stop_backend");
  },

  async restart(): Promise<string> {
    return safeInvoke<string>("restart_backend");
  },

  async status(): Promise<BackendStatus> {
    return safeInvoke<BackendStatus>("get_backend_status");
  },

  async waitForReady(): Promise<string> {
    return safeInvoke<string>("wait_for_backend");
  },
};
