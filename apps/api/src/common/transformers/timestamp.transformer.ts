export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function toDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function toTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function fromISOString(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function formatDate(timestamp: number, locale = 'es-AR'): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale);
}

export function formatDateTime(timestamp: number, locale = 'es-AR'): string {
  return new Date(timestamp * 1000).toLocaleString(locale);
}
