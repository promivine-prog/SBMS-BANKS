import { useEffect, useState } from "react";
import { provider, type Plan } from "./provider";
import { tr } from "./i18n";
import { runway } from "./runway";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const EMPTY: Plan = { essentials: 0, cash: 0, nextIncome: null, incomes: [] };
export default function PlanCard({ balance }: { balance: number | null }) {
  const [saved, setSaved] = useState<Plan>(EMPTY);
  const [ess, setEss] = useState(""), [cash, setCash] = useState("");
  const [iname, setIname] = useState(""), [iamt, setIamt] = useState(""), [idate, setIdate] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { provider.getPlan().then((p) => { setSaved(p); setEss(String(p.essentials)); setCash(String(p.cash)); }); }, []);
  const persist = async (p: Plan, ok: string) => { try { await provider.setPlan(p); setSaved(p); setMsg(ok); } catch (e: any) { setMsg(e.message ?? "Could not save."); } };
  const addIncome = () => {
    if (!iname.trim() || !(+iamt > 0) || !idate) { setMsg("Add a name, an amount and a date."); return; }
    persist({ ...saved, incomes: [...saved.incomes, { id: "i" + Date.now(), name: iname.trim(), amount: +iamt, date: idate }] }, "Income added.");
    setIname(""); setIamt(""); setIdate("");
  };
  if (balance === null) return null;
  const sorted = [...saved.incomes].sort((a, b) => a.date.localeCompare(b.date));
  const next = sorted.find((i) => i.date > today())?.date ?? sorted[sorted.length - 1]?.date ?? null;
  const r = runway(balance, saved.cash, saved.essentials, next);
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
      {r.status === "no-date" && <p className="muted">Add an expected income below to see a daily guide.</p>}
      {r.status === "stale" && <p className="muted">Your expected incomes have all passed. Add a new one so the guide stays honest.</p>}
      {(r.status === "shortfall" || r.status === "tight") && (
        <div className="warn"><strong>{r.status === "shortfall" ? `You are ${naira(r.shortfall)} short for essentials.` : "This stretch is tight."}</strong>
          <ol className="steps"><li>Pay for essentials first: food, transport, data.</li><li>Pause anything you can wait on until your next income.</li><li>Tell someone you trust early. Asking for help is a plan, not a failure.</li><li>Update your expected incomes if anything has changed.</li></ol></div>)}
      <input className="field" placeholder="Essentials to protect (₦)" inputMode="numeric" value={ess} onChange={(e) => setEss(e.target.value.replace(/\D/g, ""))} />
      <input className="field" placeholder="Cash on hand (₦)" inputMode="numeric" value={cash} onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={() => persist({ ...saved, essentials: +ess || 0, cash: +cash || 0 }, "Plan saved.")}>Save plan</button>
      <h3 className="day">Expected income (not counted in Available now until it arrives)</h3>
      {sorted.map((i) => (<div className="tx" key={i.id}><div className="grow"><div className="t1">{i.name}</div><div className="t2">{i.date}</div></div><div className="amt">{naira(i.amount)}</div>
        <button className="chipbtn" onClick={() => persist({ ...saved, incomes: saved.incomes.filter((x) => x.id !== i.id) }, "Income removed.")}>Remove</button></div>))}
      {!sorted.length && <p className="muted">No expected income yet.</p>}
      <input className="field" placeholder="Who or what (e.g. Mum, part-time job)" value={iname} onChange={(e) => setIname(e.target.value)} />
      <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={iamt} onChange={(e) => setIamt(e.target.value.replace(/\D/g, ""))} />
      <input className="field" type="date" aria-label="Expected date" value={idate} onChange={(e) => setIdate(e.target.value)} />
      <button className="ghost" onClick={addIncome}>Add expected income</button>{sim}
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>
  </>);
}
