// Client for the optional public leaderboard. The device sends events only; the server decides the points.
const K = "sbms_board";
export interface Profile { id: string; secret: string; nickname: string }
export interface Me { nickname: string; points: number; streak: number; rank: number; counts: Record<string, number>; lessons: number }
export const getProfile = (): Profile | null => { try { return JSON.parse(localStorage.getItem(K) ?? "null"); } catch { return null; } };
const store = (p: Profile | null) => { try { if (p) localStorage.setItem(K, JSON.stringify(p)); else localStorage.removeItem(K); } catch { /* ignore */ } };
async function call(body: object) {
  const r = await fetch("/api/leaderboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? "Request failed.");
  return j;
}
const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => x.toString(16).padStart(2, "0")).join("");
export async function join(nickname: string) {
  const id = crypto.randomUUID(), secret = rand(16);
  const me: Me = await call({ action: "join", id, secret, nickname });
  store({ id, secret, nickname: me.nickname }); return me;
}
export async function fetchMe() { const p = getProfile(); return p ? ((await call({ action: "me", id: p.id, secret: p.secret })) as Me) : null; }
export async function fetchBoard() {
  const r = await fetch("/api/leaderboard"); if (!r.ok) throw new Error("Could not load the leaderboard.");
  return (await r.json()).board as { nickname: string; points: number; streak: number }[];
}
export async function leave() { const p = getProfile(); if (!p) return; try { await call({ action: "leave", id: p.id, secret: p.secret }); } catch { /* ignore */ } store(null); }
export async function earn(event: string): Promise<boolean> {
  const p = getProfile(); if (!p || !navigator.onLine) return false;
  try {
    const r = await call({ action: "event", id: p.id, secret: p.secret, event });
    if (r.awarded) window.dispatchEvent(new CustomEvent("sbms:points", { detail: { awarded: r.awarded, points: r.points } }));
    return true;
  } catch { return false; }
}
export async function earnDaily(event: string) {
  const day = new Date().toISOString().slice(0, 10), k = "sbms_rw_" + event;
  try { if (localStorage.getItem(k) === day) return; } catch { /* ignore */ }
  if (await earn(event)) { try { localStorage.setItem(k, day); } catch { /* ignore */ } }
}
export const LEVELS = [{ at: 0, name: "Starter" }, { at: 50, name: "Saver" }, { at: 150, name: "Planner" }, { at: 300, name: "Budgeter" }, { at: 500, name: "Money Pro" }, { at: 800, name: "Money Master" }];
export function levelOf(points: number) {
  let i = 0; LEVELS.forEach((l, k) => { if (points >= l.at) i = k; });
  const next = LEVELS[i + 1];
  return { name: LEVELS[i].name, from: LEVELS[i].at, next: next ? next.at : null, nextName: next ? next.name : null };
}
export const BADGES: { name: string; how: string; ok: (m: Me) => boolean }[] = [
  { name: "First step", how: "Join the leaderboard", ok: () => true },
  { name: "Scholar", how: "Pass all 5 lessons", ok: (m) => m.lessons >= 5 },
  { name: "On a roll", how: "3-day streak", ok: (m) => m.streak >= 3 },
  { name: "Week strong", how: "7-day streak", ok: (m) => m.streak >= 7 },
  { name: "Scam spotter", how: "Use the scam check 5 times", ok: (m) => (m.counts.scam_check ?? 0) >= 5 },
  { name: "Saver", how: "Save to goals 5 times", ok: (m) => (m.counts.goal_save ?? 0) >= 5 },
  { name: "Planner", how: "Update your plan 3 times", ok: (m) => (m.counts.plan_update ?? 0) >= 3 },
  { name: "Locked in", how: "Set an app lock", ok: (m) => (m.counts.pin_set ?? 0) >= 1 },
  { name: "Limit setter", how: "Set a weekly limit", ok: (m) => (m.counts.limit_set ?? 0) >= 1 },
];
