import { invoke } from "@tauri-apps/api/core";
import type { MemoryUsage, SystemInfo } from "@/lib/types";

export const SystemService = {
  async info(): Promise<SystemInfo> {
    return invoke<SystemInfo>("get_system_info");
  },

  async cpuUsage(): Promise<number> {
    return invoke<number>("get_cpu_usage");
  },

  async memoryUsage(): Promise<MemoryUsage> {
    return invoke<MemoryUsage>("get_memory_usage");
  },

  async isOnline(): Promise<boolean> {
    return invoke<boolean>("is_online");
  },
};
