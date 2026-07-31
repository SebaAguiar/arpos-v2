import { invoke } from "@tauri-apps/api/core";
import type { BackendStatus } from "@/lib/types";

export const ProcessService = {
  async start(): Promise<string> {
    return invoke<string>("start_backend");
  },

  async stop(): Promise<string> {
    return invoke<string>("stop_backend");
  },

  async restart(): Promise<string> {
    return invoke<string>("restart_backend");
  },

  async status(): Promise<BackendStatus> {
    return invoke<BackendStatus>("get_backend_status");
  },

  async waitForReady(): Promise<string> {
    return invoke<string>("wait_for_backend");
  },
};
