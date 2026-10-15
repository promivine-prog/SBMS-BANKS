// Estimate only: money you entered, spread over the days until your next income. Never invents a date.
export type Status = "no-date" | "stale" | "shortfall" | "tight" | "ok";
export interface Runway { available: number; essentials: number; flexible: number; days: number | null; daily: number | null; shortfall: number; status: Status }
export function runway(balance: number, cash: number, essentials: number, nextIncome: string | null, now = new Date()): Runway {
  const available = balance + cash, flexible = available - essentials;
  const base = { available, essentials, flexible, days: null, daily: null, shortfall: Math.max(0, -flexible) };
  if (!nextIncome) return { ...base, status: "no-date" };
  const today = new Date(now.toDateString()).getTime();
  const days = Math.round((new Date(nextIncome + "T00:00:00").getTime() - today) / 864e5);
  if (!(days > 0)) return { ...base, status: "stale" };
  if (flexible <= 0) return { ...base, days, status: "shortfall" };
  const daily = flexible / days;
  return { ...base, days, daily, status: daily < 500 ? "tight" : "ok" };
}
