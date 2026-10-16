import { useEffect, useState } from "react";
import { provider, type Goal, type Tx } from "./provider";
import Learn from "./Learn";
import Simulator from "./Simulator";
import Privacy from "./Privacy";
const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
export default function MoreTab({ txs, onDone, onLock, onReset }: { txs: Tx[]; onDone: () => void; onLock: () => void; onReset: () => void }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [limit, setLimit] = useState(0);
  const [name, setName] = useState(""); const [target, setTarget] = useState(""); const [lim, setLim] = useState("");
  const [add, setAdd] = useState<Record<string, string>>({}); const [msg, setMsg] = useState("");
  const load = () => { provider.listGoals().then(setGoals); provider.getLimit().then(setLimit); };
  useEffect(() => { load(); }, []);
  const week = txs.filter((t) => t.direction === "outgoing" && t.category !== "Savings" && Date.now() - +new Date(t.createdAt) < 7 * 864e5).reduce((s, t) => s + t.amount, 0);
  const run = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); setMsg(ok); load(); onDone(); } catch (e: any) { setMsg(e.message ?? "Something went wrong."); }
  };
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  const pct = (a: number, b: number) => `${Math.min(100, (a / Math.max(1, b)) * 100)}%`;
  return (<>
    <h2>Weekly spending limit</h2>
    <div className="panel">
      <div className="row"><span>Spent this week</span><span>{naira(week)} of {naira(limit)}</span></div>
      <div className="track"><div style={{ width: pct(week, limit), background: week > limit * 0.8 ? "var(--err)" : undefined }} /></div>
      <p className="muted">Sends and withdrawals that pass this limit are blocked until you raise it.</p>
      <div className="inline"><input className="field" placeholder="New weekly limit (₦)" inputMode="numeric" value={lim} onChange={(e) => setLim(e.target.value.replace(/\D/g, ""))} />
        <button className="primary" onClick={() => run(() => provider.setLimit(+lim), "Limit updated.")}>Set limit</button></div>{sim}
    </div>
    <h2>Savings goals</h2>
    {goals.map((g) => (
      <div className="panel" key={g.id}>
        <div className="row"><strong>{g.name}</strong><span>{naira(g.saved)} of {naira(g.target)}</span></div>
        <div className="track"><div style={{ width: pct(g.saved, g.target) }} /></div>
        <div className="inline"><input className="field" placeholder="Amount to save (₦)" inputMode="numeric" value={add[g.id] ?? ""} onChange={(e) => setAdd({ ...add, [g.id]: e.target.value.replace(/\D/g, "") })} />
          <button className="primary" onClick={() => run(() => provider.contribute(g.id, +(add[g.id] ?? 0)), `Saved to ${g.name}.`)}>Save</button></div>{sim}
      </div>))}
    <div className="panel"><strong>New goal</strong>
      <input className="field" placeholder="Goal name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="field" placeholder="Target (₦)" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={() => run(() => provider.addGoal(name, +target), "Goal added.")}>Add goal</button>{sim}</div>
    {msg && <p className="muted" role="status">{msg}</p>}
    <Learn />
    <Simulator />
    <Privacy onLock={onLock} onReset={onReset} />
  </>);
}
