import { useState } from "react";
import { provider } from "./provider";
import { clearPin, hasPin, setPin } from "./pin";
import { checkPayPin, clearPayPin, hasPayPin, setPayPin } from "./paypin";
import { earn, leave } from "./rank";
export default function Privacy({ onLock, onReset }: { onLock: () => void; onReset: () => void }) {
  const [pin, setP] = useState(""); const [has, setHas] = useState(hasPin()); const [confirm, setConfirm] = useState(""); const [msg, setMsg] = useState("");
  const [oldPay, setOldPay] = useState(""), [newPay, setNewPay] = useState("");
  const changePay = async () => { try { if (!(await checkPayPin(oldPay))) throw new Error("Current payment PIN is wrong."); await setPayPin(newPay); setOldPay(""); setNewPay(""); setMsg("Payment PIN changed."); } catch (e: any) { setMsg(e.message); } };
  const save = async () => { try { await setPin(pin); setHas(true); earn("pin_set"); setP(""); setMsg("PIN set. The app locks next time it opens."); } catch (e: any) { setMsg(e.message); } };
  const exportData = async () => {
    const data = { exportedAt: new Date().toISOString(), balance: await provider.getBalance(), transactions: await provider.listTransactions(), goals: await provider.listGoals(), plan: await provider.getPlan(), weeklyLimit: await provider.getLimit() };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "sbms-data.json"; a.click(); URL.revokeObjectURL(a.href); setMsg("Your data was downloaded.");
  };
  const del = async () => { await provider.reset(); clearPin(); clearPayPin(); void leave(); setHas(false); setConfirm(""); setMsg("All your data was deleted."); onReset(); };
  return (<>
    <h2>Privacy</h2>
    <div className="panel"><strong>App lock</strong>
      <input className="field" type="password" inputMode="numeric" maxLength={4} placeholder="New 4-digit PIN" value={pin} onChange={(e) => setP(e.target.value.replace(/\D/g, ""))} />
      <div className="inline"><button className="primary" onClick={save}>{has ? "Change PIN" : "Set PIN"}</button>
        {has && <button className="primary" onClick={onLock}>Lock now</button>}
        {has && <button className="primary" onClick={() => { clearPin(); setHas(false); setMsg("PIN removed."); }}>Remove</button>}</div></div>
    {hasPayPin() ? (<div className="panel"><strong>Payment PIN</strong><p className="muted">Approves every transfer.</p>
      <input className="field" type="password" inputMode="numeric" maxLength={4} placeholder="Current payment PIN" value={oldPay} onChange={(e) => setOldPay(e.target.value.replace(/\D/g, ""))} />
      <input className="field" type="password" inputMode="numeric" maxLength={4} placeholder="New payment PIN" value={newPay} onChange={(e) => setNewPay(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={changePay}>Change payment PIN</button></div>)
      : (<div className="panel"><strong>Payment PIN</strong><p className="muted">You will create it with your first transfer.</p></div>)}
    <div className="panel"><strong>Export my data</strong><p className="muted">Download everything in the app as a file.</p><button className="primary" onClick={exportData}>Export</button></div>
    <div className="panel"><strong>Delete my data</strong><p className="muted">Removes transactions, goals, plan and PIN. Type DELETE to confirm.</p>
      <input className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
      <button className="primary" disabled={confirm !== "DELETE"} onClick={del}>Delete everything</button></div>
    <div className="panel"><strong>Demo data</strong><p className="muted">Restore the original demo data and reload the app.</p><button className="ghost" onClick={() => { try { localStorage.removeItem("sbms_sim_v1"); } catch { /* ignore */ } location.reload(); }}>Restore demo data</button></div>
    {msg && <p className="muted" role="status">{msg}</p>}
  </>);
}
