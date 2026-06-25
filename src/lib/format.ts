export const money = (n: number): string => `${(n ?? 0).toFixed(2)} ₼`;

export const shortDate = (s: string): string => (s ? s.slice(0, 10) : "—");

export function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const now = new Date("2026-06-25");
  const then = new Date(dateStr);
  return Math.round((then.getTime() - now.getTime()) / 86_400_000);
}
