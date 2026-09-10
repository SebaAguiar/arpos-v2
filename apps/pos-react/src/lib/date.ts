export type Period = "today" | "week" | "month" | "custom";

const DAY_SECONDS = 86400;

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPeriodTimestamps(
  period: Period,
  customDate?: string,
): { from?: number; to?: number } {
  const now = Math.floor(Date.now() / 1000);
  switch (period) {
    case "today": {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return { from: Math.floor(todayStart.getTime() / 1000), to: now };
    }
    case "week":
      return { from: now - 7 * DAY_SECONDS, to: now };
    case "month":
      return { from: now - 30 * DAY_SECONDS, to: now };
    case "custom": {
      if (!customDate) return { from: now - 7 * DAY_SECONDS, to: now };
      const [year, month, day] = customDate.split("-").map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      return {
        from: Math.floor(start.getTime() / 1000),
        to: Math.floor(start.getTime() / 1000) + DAY_SECONDS,
      };
    }
  }
}