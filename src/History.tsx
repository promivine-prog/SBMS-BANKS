import { useMemo, useState } from "react";
import { provider, type Tx } from "./provider";
import { tr } from "./i18n";
const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
type F = "all" | "in" | "out";
export default function History({ txs, onBack }: { txs: Tx[]; onBack: () => void }) {
  const [f, setF] = useState<F>("all");
  const list = useMemo(() => txs.filter((t) => f === "all" || (f === "in") === (t.direction === "incoming")), [txs, f]);
  const sum = (d: Tx["direction"]) => txs.filter((t) => t.direction === d).reduce((s, t) => s + t.amount, 0);
  const groups = useMemo(() => {
    const m = new Map<string, Tx[]>();
    list.forEach((t) => { const k = new Date(t.createdAt).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" }); m.set(k, [...(m.get(k) ?? []), t]); });
    return [...m.entries()];
  }, [list]);
  return (<>
    <button className="back" onClick={onBack}>← {tr("Back")}</button>
    <h2>{tr("Transaction history")}</h2>
    {provider.simulated && <span className="sim">Simulated</span>}
    <div className="panel"><div className="row"><span>Money in</span><strong className="amt incoming">{naira(sum("incoming"))}</strong></div>
      <div className="row"><span>Money out</span><strong>{naira(sum("outgoing"))}</strong></div></div>
    <div className="chips">{([["all", "All"], ["in", "Money in"], ["out", "Money out"]] as [F, string][]).map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div>
    {!list.length && <p className="empty">No transactions to show.</p>}
    {groups.map(([day, items]) => (<section key={day}><h3 className="day">{day}</h3>
      {items.map((t) => (<div className="tx" key={t.id}><div className={"dot " + t.direction}>{t.direction === "incoming" ? "↓" : "↑"}</div>
        <div className="grow"><div className="t1">{t.description}</div><div className="t2">{t.category ?? "Deposit"} · {t.status}</div></div>
        <div className={"amt " + t.direction}>{t.direction === "incoming" ? "+" : "-"}{naira(t.amount)}</div></div>))}</section>))}
  </>);
}
