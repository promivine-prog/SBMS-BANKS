import { useState } from "react";
import type { Tx } from "./provider";
import { localCoach } from "./coach";
const PROMPTS = ["Can I afford ₦5,000 shoes?", "Where can I cut spending?", "Is anything suspicious?"];
export default function Coach({ txs, balance }: { txs: Tx[]; balance: number | null }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState<{ text: string; ai: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  async function ask(question: string) {
    if (balance === null || !question.trim()) return;
    setQ(question); setBusy(true);
    const slim = txs.map((t) => ({ description: t.description, amount: t.amount, direction: t.direction, category: t.category, date: t.createdAt.slice(0, 10) }));
    try {
      const r = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, balance, txs: slim }) });
      if (!r.ok) throw new Error(String(r.status));
      setA({ text: (await r.json()).answer, ai: true });
    } catch { setA({ text: localCoach(question, balance, txs), ai: false }); }
    setBusy(false);
  }
  return (<>
    <h2>Money coach</h2>
    <div className="chips">{PROMPTS.map((p) => <button key={p} onClick={() => ask(p)}>{p}</button>)}</div>
    <div className="ask"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your money" maxLength={300} /><button onClick={() => ask(q)} disabled={busy}>{busy ? "…" : "Ask"}</button></div>
    {a && <div className="panel"><div>{a.text}</div><span className="sim">{a.ai ? "AI coach · Claude" : "Rule-based answer · AI key not set"}</span></div>}
  </>);
}
