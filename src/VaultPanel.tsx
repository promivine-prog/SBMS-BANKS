import { useEffect, useState } from "react";
import { provider, type Vault } from "./provider";
import { earn } from "./rank";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const dateIn = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const digits = (x: string) => x.replace(/\D/g, "");
type Draft = { name: string; amount: number; due: string | null };
export default function VaultPanel({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState<Vault | null | undefined>(undefined);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [bn, setBn] = useState(""), [ba, setBa] = useState(""), [bd, setBd] = useState("");
  const [start, setStart] = useState(dateIn(0)), [end, setEnd] = useState(dateIn(120)), [thr, setThr] = useState("50000");
  const [amt, setAmt] = useState(""), [narr, setNarr] = useState("NELFUND upkeep"), [bulk, setBulk] = useState(false);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const load = () => provider.getVault().then((x) => { setV(x); if (x) setThr(String(x.threshold)); });
  useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); if (ok) setMsg(ok); await load(); onDone(); } catch (e: any) { setMsg(e.message ?? "Something went wrong."); } };
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  const billForm = (onAdd: () => void, label: string) => (<>
    <input className="field" placeholder="Bill name (for example Tuition)" maxLength={30} value={bn} onChange={(e) => setBn(e.target.value)} />
    <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={ba} onChange={(e) => setBa(digits(e.target.value))} />
    <label className="t2">Due date (optional)</label><input className="field" type="date" value={bd} onChange={(e) => setBd(e.target.value)} />
    <button className="ghost" onClick={onAdd}>{label}</button></>);
  const addDraft = () => {
    if (!bn.trim() || !(+ba > 0)) { setMsg("Give the bill a name and an amount above ₦0."); return; }
    setDrafts([...drafts, { name: bn.trim(), amount: +ba, due: bd || null }]); setBn(""); setBa(""); setBd(""); setMsg("");
  };
  const total = (v?.bills ?? []).reduce((s, b) => s + b.amount, 0);
  return (<>
    <div className="panel">
      <p className="muted">When a big amount arrives (a loan, upkeep or a termly allowance), the vault locks your bills first, then releases the rest in equal daily amounts until the semester ends.</p>
      <p className="muted">Demo only: SBMS is not connected to NELFUND or any school, and nothing is paid to a school. Add no bills if your fees are paid separately.</p>
      {v === undefined ? <p className="muted">Loading…</p> : v === null ? (<>
        <h3 className="day">1. Your bills</h3>
        {drafts.map((d, i) => <div className="tx" key={i}><div className="grow"><div className="t1">{d.name}</div><div className="t2">{d.due ? `Due ${d.due}` : "No due date"}</div></div><div className="amt">{naira(d.amount)}</div><button className="chipbtn" onClick={() => setDrafts(drafts.filter((_, j) => j !== i))}>Remove</button></div>)}
        {billForm(addDraft, "Add this bill")}
        <h3 className="day">2. Your semester</h3>
        <label className="t2">Semester starts</label><input className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <label className="t2">Semester ends</label><input className="field" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <h3 className="day">3. Big deposit rule</h3>
        <input className="field" placeholder="Big deposit amount (₦, 0 to turn off)" inputMode="numeric" value={thr} onChange={(e) => setThr(digits(e.target.value))} />
        <p className="muted">Any single deposit at or above this amount starts the vault by itself.</p>
        <button className="primary" onClick={() => run(async () => { await provider.setupVault({ bills: drafts, threshold: +thr || 0, startDay: start, endDay: end }); earn("vault_setup"); }, "Vault ready. Now add the money when it arrives.")}>Create my semester vault</button>
      </>) : (<>
        <div className="row"><strong>{v.status === "done" ? "Semester finished" : v.status === "active" ? "Vault active" : "Waiting for money"}</strong><span className="t2">{v.startDay} to {v.endDay}</span></div>
        <div className="row"><span className="t2">Received so far</span><strong>{naira(v.received)}</strong></div>
        <div className="row"><span className="t2">Upkeep still to release</span><strong>{naira(v.poolRemaining)}</strong></div>
        <div className="row"><span className="t2">Days left</span><strong>{v.daysLeft}</strong></div>
        <div className="row"><strong>Today's allowance</strong><strong>{naira(v.drip)}</strong></div>
        {v.poolTotal > 0 && <div className="track"><div style={{ width: `${((v.poolTotal - v.poolRemaining) / v.poolTotal) * 100}%` }} /></div>}
        <h3 className="day">Your bills ({naira(total)} in total)</h3>
        {!v.bills.length && <p className="muted">No bills added.</p>}
        {v.bills.map((b) => (<div key={b.id} className="tx" style={{ flexWrap: "wrap" }}>
          <div className="grow"><div className="t1">{b.name}</div><div className="t2">{b.due ? `Due ${b.due} · ` : ""}{b.paid ? `Paid · ref ${b.ref}` : b.locked >= b.amount ? "Fully locked, ready to pay" : `Locking ${naira(b.locked)} of ${naira(b.amount)}`}</div></div>
          <div className="amt">{naira(b.amount)}</div>
          {!b.paid && b.locked === 0 && <button className="chipbtn" onClick={() => run(() => provider.removeBill(b.id), "Bill removed.")}>Remove</button>}
          {!b.paid && b.locked >= b.amount && (<div style={{ width: "100%" }}>
            <input className="field" placeholder="Invoice reference (6 to 24 characters)" maxLength={24} value={refs[b.id] ?? ""} onChange={(e) => setRefs({ ...refs, [b.id]: e.target.value })} />
            <button className="ghost" onClick={() => run(async () => { await provider.payBill(b.id, refs[b.id] ?? ""); earn("vault_fees_paid"); }, `${b.name} marked as paid (simulated check).`)}>Verify and pay</button></div>)}
        </div>))}
        {v.status !== "done" && (<>
          <h3 className="day">Add another bill</h3>
          {billForm(() => run(() => provider.addBill({ name: bn, amount: +ba, due: bd || null }).then(() => { setBn(""); setBa(""); setBd(""); }), "Bill added. It is filled from the next big arrival."), "Add bill")}
          <h3 className="day">Big deposit rule</h3>
          <input className="field" placeholder="Big deposit amount (₦, 0 to turn off)" inputMode="numeric" value={thr} onChange={(e) => setThr(digits(e.target.value))} />
          <button className="ghost" onClick={() => run(() => provider.setThreshold(+thr || 0), "Rule saved.")}>Save rule</button>
          <h3 className="day">Simulate money arriving</h3>
          <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={amt} onChange={(e) => setAmt(digits(e.target.value))} />
          <input className="field" placeholder="Narration" maxLength={40} value={narr} onChange={(e) => setNarr(e.target.value)} />
          <label className="agree"><input type="checkbox" checked={bulk} onChange={(e) => setBulk(e.target.checked)} /><span>Treat it as a big arrival whatever the amount or words.</span></label>
          <button className="ghost" onClick={() => run(async () => { const r = await provider.receiveInflow(+amt, narr, bulk); setMsg(r.detected ? `Detected as a big arrival (${r.reason === "threshold" ? "amount at or above your rule" : r.reason === "keyword" ? "narration words" : "you chose it"}): bills locked first, the rest goes to your daily allowance.` : "Treated as a normal deposit: it went straight to your balance."); }, "")}>Simulate arrival</button>
        </>)}
        {v.status === "done" && <button className="ghost" onClick={() => run(() => provider.clearVault(), "Cleared. You can set up a new semester.")}>Start a new semester</button>}
      </>)}
      {sim}{msg && <p className="muted" role="status">{msg}</p>}
    </div>
  </>);
}
