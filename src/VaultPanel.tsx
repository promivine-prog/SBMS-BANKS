import { useEffect, useState } from "react";
import { provider, type Vault } from "./provider";
import { earn } from "./rank";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const dateIn = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export default function VaultPanel({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState<Vault | null | undefined>(undefined);
  const [tuition, setTuition] = useState(""), [acc, setAcc] = useState(""), [start, setStart] = useState(dateIn(0)), [end, setEnd] = useState(dateIn(120));
  const [amt, setAmt] = useState(""), [narr, setNarr] = useState("NELFUND upkeep"), [bulk, setBulk] = useState(false), [ref, setRef] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => provider.getVault().then(setV);
  useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setMsg(ok); await load(); onDone(); } catch (e: any) { setMsg(e.message ?? "Something went wrong."); } };
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  const digits = (x: string) => x.replace(/\D/g, "");
  const fees = v ? v.tuition + v.accommodation : 0;
  return (<>
    <div className="panel">
      <p className="muted">When a big amount arrives (a loan, upkeep or a termly allowance), the vault locks your school fees and releases the rest in equal daily amounts until the semester ends.</p>
      <p className="muted">Demo only: SBMS is not connected to NELFUND or any school, and nothing is paid to a school. Enter 0 for fees if your school fees are paid separately.</p>
      {v === undefined ? <p className="muted">Loading…</p> : v === null ? (<>
        <input className="field" placeholder="Tuition (₦, 0 if none)" inputMode="numeric" value={tuition} onChange={(e) => setTuition(digits(e.target.value))} />
        <input className="field" placeholder="Accommodation (₦, 0 if none)" inputMode="numeric" value={acc} onChange={(e) => setAcc(digits(e.target.value))} />
        <label className="t2">Semester starts</label><input className="field" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <label className="t2">Semester ends</label><input className="field" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className="primary" onClick={() => run(async () => { await provider.setupVault({ tuition: +tuition || 0, accommodation: +acc || 0, startDay: start, endDay: end }); earn("vault_setup"); }, "Vault ready. Now add the money when it arrives.")}>Create my semester vault</button>
      </>) : (<>
        <div className="row"><strong>{v.status === "done" ? "Semester finished" : v.status === "active" ? "Vault active" : "Waiting for money"}</strong><span className="t2">{v.startDay} to {v.endDay}</span></div>
        <div className="row"><span className="t2">Received so far</span><strong>{naira(v.received)}</strong></div>
        <div className="row"><span className="t2">Locked for fees</span><strong>{naira(v.feesLocked)} of {naira(fees)} · {v.feesStatus === "PAID" ? "Paid" : "Locked"}</strong></div>
        <div className="row"><span className="t2">Upkeep still to release</span><strong>{naira(v.poolRemaining)}</strong></div>
        <div className="row"><span className="t2">Days left</span><strong>{v.daysLeft}</strong></div>
        <div className="row"><strong>Today's allowance</strong><strong>{naira(v.drip)}</strong></div>
        {v.poolTotal > 0 && <div className="track"><div style={{ width: `${((v.poolTotal - v.poolRemaining) / v.poolTotal) * 100}%` }} /></div>}
        {v.status !== "done" && (<>
          <h3 className="day">Simulate money arriving</h3>
          <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={amt} onChange={(e) => setAmt(digits(e.target.value))} />
          <input className="field" placeholder="Narration" maxLength={40} value={narr} onChange={(e) => setNarr(e.target.value)} />
          <label className="agree"><input type="checkbox" checked={bulk} onChange={(e) => setBulk(e.target.checked)} /><span>Treat it as a big allowance even without the words NELFUND or LOAN.</span></label>
          <button className="ghost" onClick={() => run(async () => { const r = await provider.receiveInflow(+amt, narr, bulk); setMsg(r.detected ? "Detected as a big inflow: fees locked, the rest goes to your daily allowance." : "Treated as a normal deposit: it went straight to your balance."); }, "")}>Simulate arrival</button>
        </>)}
        {v.feesStatus === "LOCKED" && fees > 0 && v.feesLocked >= fees && (<>
          <h3 className="day">Pay your fees</h3>
          <input className="field" placeholder="Invoice reference (6 to 24 characters)" maxLength={24} value={ref} onChange={(e) => setRef(e.target.value)} />
          <button className="ghost" onClick={() => run(async () => { await provider.payFees(ref); earn("vault_fees_paid"); }, "Fees marked as paid to the school (simulated check).")}>Verify and pay fees</button>
        </>)}
        {v.status === "done" && <button className="ghost" onClick={() => run(() => provider.clearVault(), "Cleared. You can set up a new semester.")}>Start a new semester</button>}
      </>)}
      {sim}{msg && <p className="muted" role="status">{msg}</p>}
    </div>
  </>);
}
