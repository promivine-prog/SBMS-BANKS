import { useEffect, useState } from "react";
import { provider, type Plan, type Vault } from "./provider";
import { tr } from "./i18n";
import { runway } from "./runway";
import { earn } from "./rank";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const EMPTY: Plan = { essentials: 0, cash: 0, nextIncome: null, incomes: [] };
export default function PlanCard({ balance }: { balance: number | null }) {
  const [saved, setSaved] = useState<Plan>(EMPTY);
  const [ess, setEss] = useState(""), [cash, setCash] = useState("");
  const [iname, setIname] = useState(""), [iamt, setIamt] = useState(""), [idate, setIdate] = useState("");
  const [msg, setMsg] = useState("");
  const [vault, setVault] = useState<Vault | null>(null);
  useEffect(() => { provider.getVault().then(setVault); }, [balance]);
  const [open, setOpen] = useState(() => { try { return localStorage.getItem("sbms_plan_open") !== "0"; } catch { return true; } });
  const toggle = () => { const v = !open; setOpen(v); try { localStorage.setItem("sbms_plan_open", v ? "1" : "0"); } catch { /* ignore */ } };
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
  const vOn = !!vault && vault.status === "active" && vault.poolRemaining > 0;
  const dailyShown = vOn ? vault!.drip : r.daily;
  const status = vOn ? (vault!.drip < 500 ? "tight" : "ok") : r.status; // with a vault, the vault sets the daily guide
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  return (<>
    <div className="row"><h2>{tr("My money plan")}</h2>
      <div className="row">{!open && dailyShown !== null && <span className="t2">{naira(dailyShown)} a day</span>}
        <button className="gear" aria-expanded={open} aria-label={open ? "Hide money plan" : "Show money plan"} onClick={toggle}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{open ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}</svg></button></div></div>
    {open && (<div className="panel">
      <div className="row"><span>Available now</span><span>{naira(r.available)}</span></div>
      <div className="row"><span>Protected for essentials</span><span>{naira(r.essentials)}</span></div>
      <div className="row"><span>Flexible amount</span><span>{naira(Math.max(0, r.flexible))}</span></div>
      <div className="row"><span>{vOn ? "Days left in semester" : "Days to next income"}</span><span>{vOn ? vault!.daysLeft : r.days ?? "Not set"}</span></div>
      <div className="row"><strong>{tr("Daily guide")}</strong><strong>{dailyShown === null ? "–" : naira(dailyShown)}</strong></div>
      <p className="muted">Estimate based on what you entered, not a guarantee.{vOn ? " Your daily guide comes from your semester vault." : ""}</p>
      {status === "no-date" && <p className="muted">Add an expected income below to see a daily guide.</p>}
      {status === "stale" && <p className="muted">Your expected incomes have all passed. Add a new one so the guide stays honest.</p>}
      {(status === "shortfall" || status === "tight") && (
        <div className="warn"><strong>{status === "shortfall" ? `You are ${naira(r.shortfall)} short for essentials.` : "This stretch is tight."}</strong>
          <ol className="steps"><li>Pay for essentials first: food, transport, data.</li><li>Pause anything you can wait on until your next income.</li><li>Tell someone you trust early. Asking for help is a plan, not a failure.</li><li>Update your expected incomes if anything has changed.</li></ol></div>)}
      <input className="field" placeholder="Essentials to protect (₦)" inputMode="numeric" value={ess} onChange={(e) => setEss(e.target.value.replace(/\D/g, ""))} />
      <input className="field" placeholder="Cash on hand (₦)" inputMode="numeric" value={cash} onChange={(e) => setCash(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={() => { persist({ ...saved, essentials: +ess || 0, cash: +cash || 0 }, "Plan saved."); earn("plan_update"); }}>Save plan</button>
      <h3 className="day">Expected income (not counted in Available now until it arrives)</h3>
      {sorted.map((i) => (<div className="tx" key={i.id}><div className="grow"><div className="t1">{i.name}</div><div className="t2">{i.date}</div></div><div className="amt">{naira(i.amount)}</div>
        <button className="chipbtn" onClick={() => persist({ ...saved, incomes: saved.incomes.filter((x) => x.id !== i.id) }, "Income removed.")}>Remove</button></div>))}
      {!sorted.length && <p className="muted">No expected income yet.</p>}
      <input className="field" placeholder="Who or what (e.g. Mum, part-time job)" value={iname} onChange={(e) => setIname(e.target.value)} />
      <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={iamt} onChange={(e) => setIamt(e.target.value.replace(/\D/g, ""))} />
      <input className="field" type="date" aria-label="Expected date" value={idate} onChange={(e) => setIdate(e.target.value)} />
      <button className="ghost" onClick={addIncome}>Add expected income</button>{sim}
      {msg && <p className="muted" role="status">{msg}</p>}
    </div>)}
  </>);
}
