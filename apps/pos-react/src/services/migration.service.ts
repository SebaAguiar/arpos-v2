import { getApiBaseUrl } from "@/config";

export interface MigrationProgressEvent {
  step: number;
  total: number;
  label: string;
}

export interface MigrationSummary {
  status: "ok";
  companyId: string;
  primaryStoreId: string;
  rowsMigrated: Record<string, number>;
  completedAt: number;
}

type StreamEvent =
  | ({ type: "progress" } & MigrationProgressEvent)
  | { type: "complete"; summary: MigrationSummary }
  | { type: "error"; message: string };

export interface ImportV1Input {
  databaseUrl: string;
  primaryStoreId?: string;
}

export const MigrationService = {
  async importV1(
    input: ImportV1Input,
    onProgress?: (progress: MigrationProgressEvent) => void,
  ): Promise<MigrationSummary> {
    const res = await fetch(`${getApiBaseUrl()}/migration/import/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => res.statusText);
      let message = text;
      try {
        const parsed = JSON.parse(text);
        message = parsed.message ?? text;
      } catch {
        // text is not JSON, use as-is
      }
      throw new Error(message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const parseLine = (line: string): StreamEvent => JSON.parse(line);

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim().length === 0) continue;
        const event = parseLine(line);
        if (event.type === "progress") {
          onProgress?.({
            step: event.step,
            total: event.total,
            label: event.label,
          });
        } else if (event.type === "complete") {
          return event.summary;
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    }

    throw new Error("La migración terminó sin confirmación");
  },
};
