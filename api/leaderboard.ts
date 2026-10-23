declare const process: any;
// Public leaderboard. Stores only: nickname, points, streak, activity counts, and a hash of a device secret.
// The browser sends EVENTS, never totals. The server applies the rules and daily caps, so scores cannot be set directly.
const sbAuth = (k: string): Record<string, string> => (k.startsWith("sb_") ? { apikey: k } : { apikey: k, Authorization: `Bearer ${k}` });
const H = (): Record<string, string> => ({ ...sbAuth(process.env.SUPABASE_SERVICE_KEY ?? ""), "Content-Type": "application/json" });
const T = () => `${process.env.SUPABASE_URL}/rest/v1/leaderboard`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BAD = ["admin", "sbms", "moderator", "staff", "fuck", "shit", "bitch", "porn", "sex", "nigga", "rape", "kill"];
const RULES: Record<string, { pts: number; perDay?: number; once?: boolean }> = {
  daily_checkin: { pts: 5, perDay: 1 }, under_limit: { pts: 5, perDay: 1 }, lesson: { pts: 10, once: true },
  goal_save: { pts: 5, perDay: 2 }, scam_check: { pts: 3, perDay: 3 }, coach_question: { pts: 2, perDay: 3 },
  plan_update: { pts: 5, perDay: 1 }, limit_set: { pts: 10, once: true }, pin_set: { pts: 10, once: true },
};
async function sha(s: string) {
  const b = await (globalThis as any).crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b), (x: number) => x.toString(16).padStart(2, "0")).join("");
}
const wat = (daysAgo = 0) => new Date(Date.now() + 3600000 - daysAgo * 864e5).toISOString().slice(0, 10); // Nigeria time (UTC+1)
async function getRow(id: string) { const r = await fetch(`${T()}?id=eq.${id}&select=*`, { headers: H() }); const j = r.ok ? await r.json() : []; return j[0] ?? null; }
async function rankOf(points: number) {
  const r = await fetch(`${T()}?points=gt.${points}&select=id&limit=1`, { headers: { ...H(), Prefer: "count=exact" } });
  const n = parseInt((r.headers.get("content-range") ?? "").split("/")[1] ?? "0", 10);
  return (isNaN(n) ? 0 : n) + 1;
}
async function profile(row: any) {
  const st = row.state ?? {};
  return { nickname: row.nickname, points: row.points, streak: row.streak, rank: await rankOf(row.points), counts: st.counts ?? {}, lessons: Object.keys(st.once ?? {}).filter((k) => k.startsWith("lesson:")).length };
}
export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      const r = await fetch(`${T()}?select=nickname,points,streak&order=points.desc,updated_at.asc&limit=50`, { headers: H() });
      if (!r.ok) return res.status(502).json({ error: "Could not load the leaderboard." });
      return res.status(200).json({ board: await r.json() });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only" });
    const { action, id, secret, nickname, event } = req.body ?? {};
    if (!UUID.test(String(id ?? "")) || String(secret ?? "").length < 16) return res.status(400).json({ error: "Bad request." });
    const hash = await sha(String(secret));
    if (action === "join") {
      const nick = String(nickname ?? "").trim();
      if (!/^[A-Za-z0-9_]{3,16}$/.test(nick) || BAD.some((b) => nick.toLowerCase().includes(b))) return res.status(400).json({ error: "Nickname must be 3 to 16 letters, numbers or underscores, and appropriate." });
      const r = await fetch(T(), { method: "POST", headers: { ...H(), Prefer: "return=representation" }, body: JSON.stringify({ id, nickname: nick, secret_hash: hash }) });
      if (r.status === 409) return res.status(409).json({ error: "That nickname is taken. Try another." });
      if (!r.ok) return res.status(502).json({ error: "Could not join right now." });
      return res.status(200).json(await profile((await r.json())[0]));
    }
    const row = await getRow(id);
    if (!row || row.secret_hash !== hash) return res.status(403).json({ error: "Not signed in to the leaderboard." });
    if (action === "me") return res.status(200).json(await profile(row));
    if (action === "leave") { await fetch(`${T()}?id=eq.${id}`, { method: "DELETE", headers: H() }); return res.status(200).json({ left: true }); }
    if (action === "event") {
      const ev = String(event ?? ""), [type, arg] = ev.split(":"), rule = RULES[type];
      if (!rule) return res.status(400).json({ error: "Unknown event." });
      if (type === "lesson" && !/^[0-4]$/.test(arg ?? "")) return res.status(400).json({ error: "Unknown lesson." });
      const today = wat(), st = row.state ?? {};
      st.once = st.once ?? {}; st.days = st.days ?? {}; st.counts = st.counts ?? {};
      const day = (st.days[today] = st.days[today] ?? {});
      let award = 0, streak = row.streak, lastDay = row.last_day;
      if (rule.once) { if (!st.once[ev]) { st.once[ev] = 1; award = rule.pts; } }
      else if ((day[type] ?? 0) < (rule.perDay ?? 1)) { day[type] = (day[type] ?? 0) + 1; award = rule.pts; }
      if (award && type === "daily_checkin") { streak = lastDay === wat(1) ? streak + 1 : 1; lastDay = today; award += Math.min(streak, 7); }
      if (award) st.counts[type] = (st.counts[type] ?? 0) + 1;
      for (const d of Object.keys(st.days)) if (d < wat(3)) delete st.days[d];
      const points = row.points + award;
      await fetch(`${T()}?id=eq.${id}`, { method: "PATCH", headers: H(), body: JSON.stringify({ points, streak, last_day: lastDay, state: st, updated_at: new Date().toISOString() }) });
      return res.status(200).json({ ...(await profile({ ...row, points, streak, state: st })), awarded: award });
    }
    return res.status(400).json({ error: "Unknown action." });
  } catch { return res.status(500).json({ error: "Something went wrong." }); }
}
