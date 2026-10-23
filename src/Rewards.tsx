import { useEffect, useState } from "react";
import { provider, type Tx } from "./provider";
import { BADGES, earnDaily, fetchBoard, fetchMe, getProfile, join, leave, levelOf, flushQueue, queueSize, tierOf, type Me } from "./rank";
import { useOnline } from "./online";
type Row = { nickname: string; points: number; streak: number };
const CACHE = "sbms_board_cache";
// Invisible helper: once a day, claims the check-in and "stayed under your limit" points if the user has joined.
export function RewardsAgent({ txs, online }: { txs: Tx[]; online: boolean }) {
  useEffect(() => {
    if (!online || !getProfile()) return;
    flushQueue();
    if (!txs.length) return;
    earnDaily("daily_checkin");
    provider.getLimit().then((lim) => {
      const week = txs.filter((t) => t.direction === "outgoing" && t.category !== "Savings" && Date.now() - +new Date(t.createdAt) < 7 * 864e5).reduce((s, t) => s + t.amount, 0);
      if (lim && week <= lim) earnDaily("under_limit");
    });
  }, [online, txs.length]);
  return null;
}
const EARN: [string, string][] = [["Open the app each day", "5 + streak bonus"], ["Stay under your weekly limit", "5 a day"], ["Pass a lesson quiz", "10 each"], ["Save to a goal", "5 (twice a day)"], ["Use the scam check", "3 (3 a day)"], ["Ask the coach", "2 (3 a day)"], ["Update your plan", "5 a day"], ["Set a weekly limit", "10 once"], ["Set an app lock", "10 once"], ["Read the tip of the day", "5 a day"], ["Start an Allowance Smoother", "10 once"], ["Finish an Allowance Smoother", "30 once"]];
export default function Rewards({ onBack }: { onBack: () => void }) {
  const online = useOnline();
  const [profile, setProfile] = useState(getProfile());
  const [me, setMe] = useState<Me | null>(null);
  const [board, setBoard] = useState<Row[]>(() => { try { return JSON.parse(localStorage.getItem(CACHE) ?? "[]"); } catch { return []; } });
  const [nick, setNick] = useState(""), [agree, setAgree] = useState(false), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const load = async () => {
    if (!navigator.onLine) return;
    try { const b = await fetchBoard(); setBoard(b); try { localStorage.setItem(CACHE, JSON.stringify(b)); } catch { /* ignore */ } } catch { setMsg("Could not load the leaderboard."); }
    if (getProfile()) { try { setMe(await fetchMe()); } catch (e: any) { setMsg(e.message ?? "Could not load your rewards."); } }
  };
  useEffect(() => { load(); }, [online]);
  const doJoin = async () => {
    setBusy(true); setMsg("");
    try { const m = await join(nick.trim()); setProfile(getProfile()); setMe(m); await earnDaily("daily_checkin"); await load(); }
    catch (e: any) { setMsg(e.message ?? "Could not join."); }
    setBusy(false);
  };
  const doLeave = async () => { if (!window.confirm("Leave the leaderboard? Your points are deleted.")) return; await leave(); setProfile(null); setMe(null); await load(); };
  const lv = me ? levelOf(me.points) : null;
  return (<>
    <button className="back" onClick={onBack}>← Back</button>
    <h2>Rewards</h2>
    <p className="muted">Earn points for good money habits, never for how much money you have. Demo leaderboard: scores are checked and capped by the server, but there are no real accounts.</p>
    {!online && <div className="warn" role="status"><strong>You are offline.</strong> Points you earn now are saved and added when you reconnect (daily limits still apply). The board below is the last saved copy.{queueSize() > 0 ? ` ${queueSize()} waiting to sync.` : ""}</div>}
    {!profile ? (<div className="panel"><strong>Join the global leaderboard</strong>
      <p className="muted">Choose a nickname. Only your nickname and points are shown publicly. No names, emails or money amounts ever leave your device.</p>
      <input className="field" placeholder="Nickname (3-16 letters, numbers, _)" maxLength={16} value={nick} onChange={(e) => setNick(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))} />
      <label className="agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I understand my nickname and points will be public.</span></label>
      <button className="primary" disabled={busy || !agree || nick.length < 3 || !online} onClick={doJoin}>{busy ? "Joining…" : "Join"}</button></div>)
    : me && lv ? (<>
      <div className="panel"><div className="row"><strong>{me.nickname}</strong><span className="sim">{lv.name}{tierOf(me.points) ? ` · ${tierOf(me.points)}` : ""}</span></div>
        <div className="acct">{me.points} pts</div>
        {lv.next !== null && <><div className="track"><div style={{ width: `${Math.min(100, ((me.points - lv.from) / (lv.next - lv.from)) * 100)}%` }} /></div><p className="muted">{lv.next - me.points} points to {lv.nextName}</p></>}
        <div className="row"><span>Streak</span><strong>🔥 {me.streak} day{me.streak === 1 ? "" : "s"}</strong></div>
        <div className="row"><span>Your rank</span><strong>#{me.rank}</strong></div></div>
      <p className="muted">Bronze, Silver and Gold are labels for 100, 500 and 1,500 points. Fee discounts and campus perks are future plans and are not active.</p>
      <h2>Badges</h2>
      <div className="badges">{BADGES.map((b) => { const ok = b.ok(me); return <div key={b.name} className={"badge2" + (ok ? " got" : "")}><strong>{ok ? "★ " : "🔒 "}{b.name}</strong><span>{b.how}</span></div>; })}</div>
    </>) : <p className="muted">Loading your rewards…</p>}
    <h2>How to earn</h2>
    <div className="panel">{EARN.map(([a, b]) => <div className="row" key={a}><span className="t2">{a}</span><strong>{b}</strong></div>)}</div>
    <h2>Leaderboard</h2>
    {!board.length && <p className="empty">No one is on the board yet. Be the first!</p>}
    {board.map((r, i) => (<div className={"tx" + (me && r.nickname === me.nickname ? " mine" : "")} key={r.nickname}><div className="dot incoming">{i + 1}</div>
      <div className="grow"><div className="t1">{r.nickname}</div><div className="t2">🔥 {r.streak}</div></div><div className="amt">{r.points}</div></div>))}
    <button className="ghost" onClick={load}>Refresh</button>
    {profile && <button className="ghost" onClick={doLeave}>Leave the leaderboard</button>}
    {msg && <p className="muted" role="status">{msg}</p>}
  </>);
}
