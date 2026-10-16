import { useEffect, useState } from "react";
import { provider } from "./provider";
import { tr } from "./i18n";
import { runway } from "./runway";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
export default function PlanCard({ balance }: { balance: number | null }) {
  const [ess, setEss] = useState(""); const [cash, setCash] = useState(""); const [date, setDate] = useState("");
  const [saved, setSaved] = useState({ essentials: 0, cash: 0, nextIncome: null as string | null });
  const [msg, setMsg] = useState("");
  useEffect(() => { provider.getPlan().then((p) => { setSaved(p); setEss(String(p.essentials)); setCash(String(p.cash)); setDate(p.nextIncome ?? ""); }); }, []);
  const save = async () => {
    try { const p = { essentials: +ess || 0, cash: +cash || 0, nextIncome: date || null }; await provider.setPlan(p); setSaved(p); setMsg("Plan saved."); }
    catch (e: any) { setMsg(e.message ?? "Could not save."); }
  };
  if (balance === null) return null;
  const r = runway(balance, saved.cash, saved.essentials, saved.nextIncome);
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  return (<>
    <h2>{tr("My money plan")}</h2>
    <div className="panel">
      <div className="row"><span>Available now</span><span>{naira(r.available)}</span></div>
      <div className="row"><span>Protected for essentials</span><span>{naira(r.essentials)}</span></div>
      <div className="row"><span>Flexible amount</span><span>{naira(Math.max(0, r.flexible))}</span></div>
      <div className="row"><span>Days to next income</span><span>{r.days ?? "Not set"}</span></div>
      <div className="row"><strong>{tr("Daily guide")}</strong><strong>{r.daily === null ? "–" : naira(r.daily)}</strong></div>
      <p className="muted">Estimate based on what you entered, not a guarantee.</p>
      {r.status === "no-date" && <p className="muted">Add your next income date to see a daily guide.</p>}
      {r.status === "stale" && <p className="muted">That income date has passed. Update it so the guide stays honest.</p>}
      {(r.status === "shortfall" || r.status === "tight") && (
        <div className="warn"><strong>{r.status === "shortfall" ? `You are ${naira(r.shortfall)} short for essentials.` : "This stretch is tight."}</strong>
          <ol className="steps"><li>Pay for essentials first: food, transport, data.</li><li>Pause anything you can wait on until your next income.</li><li>Tell someone you trust early. Asking for help is a plan, not a failure.</li><li>Update your next income date if it has changed.</li></ol></div>)}
      <input className="field" placeholder="Essentials to protect (₦)" inputMode="numeric" value={ess} onChange={(e) => setEss(e.target.value.replace(/\D/g, ""))} />
      <input className="field" placeholder="Cash on hand (₦)" inputMode="numeric" value={cash} onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))} />
      <input className="field" type="date" aria-label="Next income date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className="primary" onClick={save}>Save plan</button>{sim}
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>
  </>);
}
