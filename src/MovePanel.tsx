import { useState } from "react";
import { provider, type DepositAccount, type Tx } from "./provider";
import { localScam, type Level } from "./scam";
const BANKS = ["Access Bank", "GTBank", "UBA", "Zenith Bank", "First Bank", "Opay"];
export default function MovePanel({ acct, onDone, txs, balance, onReceipt }: { acct: DepositAccount | null; onDone: () => void; txs: Tx[]; balance: number | null; onReceipt: (t: Tx) => void }) {
  const [copied, setCopied] = useState(false);
  const [to, setTo] = useState(""); const [amt, setAmt] = useState("");
  const [bank, setBank] = useState(BANKS[0]); const [num, setNum] = useState(""); const [wamt, setWamt] = useState("");
  const [msg, setMsg] = useState("");
  const [check, setCheck] = useState<{ level: Level; reason: string; by: string } | null>(null);
  const runCheck = async () => {
    const amount = +amt, name = to.trim() || "a friend";
    setCheck(null);
    if (!(amount > 0)) { setMsg("Enter an amount to check."); return; }
    const local = localScam(name, amount, balance ?? 0, txs);
    let level: Level = local.level, reason = local.reason, by = "Rule-based check";
    try {
      const slim = txs.map((t) => ({ description: t.description, amount: t.amount, direction: t.direction, category: t.category, date: t.createdAt.slice(0, 10) }));
      const r = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: `Scam check. The user wants to send ₦${amount} to "${name}". Start your reply with exactly one word: LOW, MEDIUM or HIGH. Then give one short reason.`, balance, txs: slim }) });
      if (r.ok) {
        const j = await r.json(); const m = /^\s*(LOW|MEDIUM|HIGH)\b[:\s-]*/i.exec(j.answer ?? "");
        if (m) { const order = { LOW: 0, MEDIUM: 1, HIGH: 2 }; const ai = m[1].toUpperCase() as Level;
          if (order[ai] >= order[level]) { level = ai; reason = j.answer.slice(m[0].length).trim() || reason; } by = `AI check · ${j.provider}`; }
      }
    } catch { /* keep the rule-based result */ }
    setCheck({ level, reason, by });
  };
  const run = async (fn: () => Promise<Tx | void>, ok: string) => {
    try { const r = await fn(); setMsg(ok); onDone(); if (r) onReceipt(r); } catch (e: any) { setMsg(e.message ?? "Something went wrong."); }
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
      <button className="primary" onClick={() => run(() => provider.sendMoney(to.trim() || "a friend", +amt), "Sent.")}>Send</button>
      <button className="ghost" onClick={runCheck}>Check before sending</button>
      {check && <div className={check.level === "LOW" ? "panel" : "warn"} role="status"><strong>{check.level === "LOW" ? "Looks safe" : check.level === "MEDIUM" ? "Be careful" : "High risk. Do not send until you are sure."}</strong><p>{check.reason}</p><span className="sim">{check.by}</span></div>}{sim}</div>
    <h2>Withdraw to a bank</h2>
    <div className="panel"><select className="field" value={bank} onChange={(e) => setBank(e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>
      <input className="field" placeholder="Account number (10 digits)" inputMode="numeric" maxLength={10} value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))} />
      <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={wamt} onChange={(e) => setWamt(e.target.value.replace(/\D/g, ""))} />
      <button className="primary" onClick={() => num.length !== 10 ? setMsg("Enter a 10-digit account number.") : run(() => provider.withdraw(bank, num, +wamt), "Withdrawal requested.")}>Withdraw</button>{sim}</div>
    {msg && <p className="muted" role="status">{msg}</p>}
  </>);
}
