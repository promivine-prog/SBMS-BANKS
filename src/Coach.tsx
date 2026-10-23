import { useState } from "react";
import type { Tx } from "./provider";
import { localCoach } from "./coach";
import { tr } from "./i18n";
import { earn } from "./rank";
const PROMPTS = ["Can I afford ₦5,000 shoes?", "Where can I cut spending?", "Is anything suspicious?"];
export default function Coach({ txs, balance }: { txs: Tx[]; balance: number | null }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState<{ text: string; by: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function ask(question: string) {
    if (balance === null || !question.trim()) return;
    setQ(question); setBusy(true); earn("coach_question");
    const slim = txs.map((t) => ({ description: t.description, amount: t.amount, direction: t.direction, category: t.category, date: t.createdAt.slice(0, 10) }));
    try {
      const r = await fetch("/api/coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, balance, txs: slim }) });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json(); setA({ text: j.answer, by: `AI coach · ${j.provider}` });
    } catch { setA({ text: localCoach(question, balance, txs), by: "Rule-based answer · AI key not set" }); }
    setBusy(false);
  }
  return (<>
    <h2>{tr("Money coach")}</h2>
    <div className="chips">{PROMPTS.map((p) => <button key={p} onClick={() => ask(p)}>{p}</button>)}</div>
    <div className="ask"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about your money" maxLength={300} /><button onClick={() => ask(q)} disabled={busy}>{busy ? "…" : "Ask"}</button></div>
    {a && <div className="panel"><div>{a.text}</div><span className="sim">{a.by}</span></div>}
  </>);
}
