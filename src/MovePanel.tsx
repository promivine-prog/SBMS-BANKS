import { useEffect, useState } from "react";
import { provider, type DepositAccount, type Tx } from "./provider";
import { localScam, type Level } from "./scam";
import { BANKS, lookup } from "./lookup";
import { checkPayPin, hasPayPin, setPayPin } from "./paypin";
import { naira } from "./txui";
type Step = "home" | "form" | "review" | "pin";
export default function MovePanel({ acct, onDone, txs, balance, onReceipt }: { acct: DepositAccount | null; onDone: () => void; txs: Tx[]; balance: number | null; onReceipt: (t: Tx) => void }) {
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<Step>("home");
  const [kind, setKind] = useState<"sbms" | "bank">("sbms");
  const [bank, setBank] = useState(BANKS[0]);
  const [num, setNum] = useState(""), [name, setName] = useState(""), [lookErr, setLookErr] = useState(""), [looking, setLooking] = useState(false);
  const [amt, setAmt] = useState(""), [narr, setNarr] = useState("");
  const [pin, setPin] = useState(""), [pin2, setPin2] = useState("");
  const [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0), [lockUntil, setLockUntil] = useState(0);
  const [limit, setLimit] = useState(0);
  const [check, setCheck] = useState<{ level: Level; reason: string; by: string } | null>(null);
  useEffect(() => { provider.getLimit().then(setLimit); }, [txs]);
  useEffect(() => {
    setName(""); setLookErr(""); setLooking(false);
    if (num.length !== 10) return;
    let live = true; setLooking(true);
    lookup(kind, bank, num).then((r) => { if (!live) return; setLooking(false); if (r.ok) setName(r.name); else setLookErr(r.error); });
    return () => { live = false; };
  }, [num, bank, kind]);
  const sim = provider.simulated && <span className="sim">Simulated</span>;
  const amount = +amt;
  const digits = (v: string) => v.replace(/\D/g, "");
  const week = txs.filter((t) => t.direction === "outgoing" && t.category !== "Savings" && Date.now() - +new Date(t.createdAt) < 7 * 864e5).reduce((s, t) => s + t.amount, 0);
  const reset = () => { setStep("home"); setNum(""); setAmt(""); setNarr(""); setPin(""); setPin2(""); setCheck(null); setFails(0); setMsg(""); };
  const start = (k: "sbms" | "bank") => { setKind(k); setMsg(""); setCheck(null); setStep("form"); };
  const next = () => {
    setMsg("");
    if (!name) { setMsg("Enter a valid account number first."); return; }
    if (!(amount > 0)) { setMsg("Enter an amount above ₦0."); return; }
    if (balance !== null && amount > balance) { setMsg("Not enough balance for this amount."); return; }
    if (limit && week + amount > limit) { setMsg(`This would pass your weekly limit of ${naira(limit)}. Raise it in More to continue.`); return; }
    setStep("review");
  };
  const runCheck = async () => {
    setCheck(null);
    if (!name || !(amount > 0)) { setMsg("Enter a valid account and amount to check."); return; }
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
  const create = !hasPayPin();
  const pay = async () => {
    if (Date.now() < lockUntil) { setMsg("Too many wrong attempts. Try again in a moment."); return; }
    setBusy(true); setMsg("");
    try {
      if (create) { if (pin !== pin2) throw new Error("The two PINs do not match."); await setPayPin(pin); }
      else if (!(await checkPayPin(pin))) {
        const f = fails + 1; setPin("");
        if (f >= 3) { setFails(0); setLockUntil(Date.now() + 30000); throw new Error("Wrong PIN. Locked for 30 seconds."); }
        setFails(f); throw new Error(`Wrong PIN. ${3 - f} attempt${3 - f === 1 ? "" : "s"} left.`);
      }
      const to = { name, account: num, bank: kind === "sbms" ? "SBMS" : bank };
      const tx = kind === "sbms" ? await provider.sendMoney(to, amount, narr.trim() || undefined) : await provider.withdraw(to, amount, narr.trim() || undefined);
      onDone(); reset(); onReceipt(tx);
    } catch (e: any) { setMsg(e.message ?? "Something went wrong."); }
    setBusy(false);
  };
  if (step === "form") return (<>
    <button className="back" onClick={reset}>← Cancel</button>
    <h2>{kind === "sbms" ? "Send to an SBMS account" : "Send to a bank account"}</h2>
    <div className="panel">
      {kind === "bank" && <select className="field" aria-label="Bank" value={bank} onChange={(e) => setBank(e.target.value)}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select>}
      <input className="field" placeholder="Account number (10 digits)" inputMode="numeric" maxLength={10} value={num} onChange={(e) => setNum(digits(e.target.value))} />
      {kind === "sbms" && <p className="muted">Demo: SBMS accounts start with 20, for example 2000000001.</p>}
      {looking && <p className="muted">Checking account…</p>}
      {name && <div className="found" role="status"><span>✓ {name}</span><span className="sim">Simulated name lookup</span></div>}
      {lookErr && <p className="muted" role="alert">{lookErr}</p>}
      <input className="field" placeholder="Amount (₦)" inputMode="numeric" value={amt} onChange={(e) => setAmt(digits(e.target.value))} />
      <input className="field" placeholder="Narration (optional)" maxLength={40} value={narr} onChange={(e) => setNarr(e.target.value)} />
      <button className="ghost" onClick={runCheck}>Check before sending</button>
      {check && <div className={check.level === "LOW" ? "panel" : "warn"} role="status"><strong>{check.level === "LOW" ? "Looks safe" : check.level === "MEDIUM" ? "Be careful" : "High risk. Do not send until you are sure."}</strong><p>{check.reason}</p><span className="sim">{check.by}</span></div>}
      <button className="primary" onClick={next}>Continue</button>{sim}
    </div>
    {msg && <p className="muted" role="status">{msg}</p>}
  </>);
  if (step === "review") return (<>
    <button className="back" onClick={() => setStep("form")}>← Back</button>
    <h2>Review transfer</h2>
    <div className="panel">
      {([["To", name], ["Bank", kind === "sbms" ? "SBMS" : bank], ["Account", num], ["Amount", naira(amount)], ["Narration", narr.trim() || "None"]] as [string, string][]).map(([k, v]) => <div className="row" key={k}><span className="t2">{k}</span><strong>{v}</strong></div>)}
      <p className="muted">{kind === "bank" ? "Bank transfers show as Pending first, then Sent." : "SBMS transfers arrive instantly."} Simulated: no money moves.</p>
      <button className="primary" onClick={() => { setPin(""); setPin2(""); setMsg(""); setStep("pin"); }}>Confirm</button>{sim}
    </div>
  </>);
  if (step === "pin") return (<>
    <button className="back" onClick={() => setStep("review")}>← Back</button>
    <h2>{create ? "Create your payment PIN" : "Enter your payment PIN"}</h2>
    <div className="panel">
      <p className="muted">{create ? "Choose a 4-digit PIN. You will use it to approve every transfer." : `Approve ${naira(amount)} to ${name}.`}</p>
      <input className="field pin" type="password" inputMode="numeric" maxLength={4} autoFocus aria-label="Payment PIN" placeholder={create ? "New PIN" : ""} value={pin} onChange={(e) => setPin(digits(e.target.value))} />
      {create && <input className="field pin" type="password" inputMode="numeric" maxLength={4} aria-label="Confirm payment PIN" placeholder="Confirm PIN" value={pin2} onChange={(e) => setPin2(digits(e.target.value))} />}
      <button className="primary" disabled={busy || pin.length !== 4 || (create && pin2.length !== 4)} onClick={pay}>{busy ? "Sending…" : `Pay ${naira(amount)}`}</button>{sim}
    </div>
    {msg && <p className="muted" role="alert">{msg}</p>}
  </>);
  return (<>
    <h2>Add money</h2>
    <p className="muted">Transfer from any bank app to this account. It lands in your wallet.</p>
    {acct && <div className="panel"><div className="t2">{acct.bank}</div><div className="acct">{acct.number}</div><div className="t1">{acct.name}</div>
      <button className="primary" onClick={() => { navigator.clipboard?.writeText(acct.number); setCopied(true); }}>{copied ? "Copied" : "Copy account number"}</button>{sim}</div>}
    <h2>Send money</h2>
    <div className="panel">
      <button className="primary" onClick={() => start("sbms")}>To an SBMS account</button>
      <button className="ghost" onClick={() => start("bank")}>To a bank account</button>{sim}
    </div>
  </>);
}
