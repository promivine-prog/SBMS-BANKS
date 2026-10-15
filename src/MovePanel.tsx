import { useState } from "react";
import { provider, type DepositAccount } from "./provider";
const BANKS = ["Access Bank", "GTBank", "UBA", "Zenith Bank", "First Bank", "Opay"];
export default function MovePanel({ acct, onDone }: { acct: DepositAccount | null; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [to, setTo] = useState(""); const [amt, setAmt] = useState("");
  const [bank, setBank] = useState(BANKS[0]); const [num, setNum] = useState(""); const [wamt, setWamt] = useState("");
  const [msg, setMsg] = useState("");
  const run = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); setMsg(ok); onDone(); } catch (e: any) { setMsg(e.message ?? "Something went wrong."); }
  };
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  return (<>
    <h2>Add money</h2>
    <p className="muted">Transfer from any bank app to this account. It lands in your wallet.</p>
    {acct && <div className="panel"><div className="t2">{acct.bank}</div><div className="acct">{acct.number}</div><div className="t1">{acct.name}</div>
      <button className="primary" onClick={() => { navigator.clipboard?.writeText(acct.number); setCopied(true); }}>{copied ? "Copied" : "Copy account number"}</button>{sim}</div>}
    <h2>Send to a friend</h2>
    <div className="panel"><input className="field" placeholder="Friend's name" value={to} onChange={(e) => setTo(e.target.value)} />
      <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={() => run(() => provider.sendMoney(to.trim() || "a friend", +amt), "Sent.")}>Send</button>{sim}</div>
    <h2>Withdraw to a bank</h2>
    <div className="panel"><select className="field" value={bank} onChange={(e) => setBank(e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
      <input className="field" placeholder="Account number (10 digits)" inputMode="numeric" maxLength={10} value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))} />
      <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={wamt} onChange={(e) => setWamt(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={() => num.length !== 10 ? setMsg("Enter a 10-digit account number.") : run(() => provider.withdraw(bank, num, +wamt), "Withdrawal requested.")}>Withdraw</button>{sim}</div>
    {msg && <p className="muted" role="status">{msg}</p>}
  </>);
}
