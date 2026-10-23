import { useEffect, useState } from "react";
import { provider, type Smoother } from "./provider";
import { earn, earnDaily } from "./rank";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
const share = (s: Smoother, k: number) => (k >= s.days ? s.total - s.daily * (s.days - 1) : s.daily);
export default function SmootherPanel({ onDone }: { onDone: () => void }) {
  const [s, setS] = useState<Smoother | null>(null);
  const [amt, setAmt] = useState(""), [days, setDays] = useState("14"), [msg, setMsg] = useState("");
  const load = () => provider.getSmoother().then(setS);
  useEffect(() => { load(); }, []);
  useEffect(() => { if (s?.status === "completed") earnDaily("smoother_complete"); }, [s?.status]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setMsg(ok); await load(); onDone(); } catch (e: any) { setMsg(e.message ?? "Something went wrong."); } };
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  const preview = Math.floor((+amt || 0) / (+days || 1));
  const released = s ? (s.releasedDays >= s.days ? s.total : s.daily * s.releasedDays) : 0;
  return (<>
    <h2>Allowance Smoother</h2>
    <div className="panel">
      {!s || s.status !== "active" ? (<>
        {s && <p className="muted" role="status">{s.status === "completed" ? "Your last Smoother finished. Well done." : "Your last Smoother was broken early."}</p>}
        <p className="muted">Lock your allowance and get it back in equal daily amounts, so it lasts until the next one.</p>
        <input className="field" placeholder="Amount to lock (₦)" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))} />
        <input className="field" placeholder="Number of days (2 to 60)" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
        {preview > 0 && <p className="muted">You would get about {naira(preview)} a day. The first share arrives now.</p>}
        <button className="primary" onClick={() => run(async () => { if (s) await provider.clearSmoother(); await provider.startSmoother(+amt, +days); earn("smoother_start"); }, "Locked. Your first share is already in your balance.")}>Lock and start</button>
      </>) : (<>
        <div className="row"><strong>Day {s.releasedDays} of {s.days}</strong><span>{naira(share(s, s.releasedDays + 1))} next</span></div>
        <div className="track"><div style={{ width: `${(s.releasedDays / s.days) * 100}%` }} /></div>
        <div className="row"><span className="t2">Released so far</span><strong>{naira(released)}</strong></div>
        <div className="row"><span className="t2">Still locked</span><strong>{naira(s.total - released)}</strong></div>
        <button className="ghost" onClick={() => { if (window.confirm("Break the Smoother? The rest of the locked money is released now, and it is marked as broken.")) run(() => provider.breakSmoother(), "Released. The Smoother is marked as broken."); }}>Break in an emergency</button>
      </>)}
      {sim}{msg && <p className="muted" role="status">{msg}</p>}
    </div>
  </>);
}
