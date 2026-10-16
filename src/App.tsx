import { useEffect, useMemo, useState } from "react";
import { provider, type CardInfo, type DepositAccount, type Tx } from "./provider";
import MovePanel from "./MovePanel";
import Coach from "./Coach";
import MoreTab from "./MoreTab";
import PlanCard from "./PlanCard";
import LockScreen from "./Lock";
import Privacy from "./Privacy";
import { hasPin } from "./pin";

const naira = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
type Tab = "home" | "move" | "cards" | "insights" | "more";
const ICONS: Record<Tab, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  move: "M7 7h11l-3-3M17 17H6l3 3",
  cards: "M3 6h18v12H3zM3 10h18",
  insights: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};
const LABELS: Record<Tab, string> = { home: "Home", move: "Move", cards: "Cards", insights: "Insights", more: "More" };

const Sim = () => provider.simulated ? <span className="sim">Simulated</span> : null;

function dayLabel(iso: string) {
  const d = new Date(iso), t = new Date();
  const diff = Math.round((new Date(t.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

function TxList({ txs }: { txs: Tx[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, Tx[]>();
    txs.forEach((t) => { const k = dayLabel(t.createdAt); m.set(k, [...(m.get(k) ?? []), t]); });
    return [...m.entries()];
  }, [txs]);
  if (!txs.length) return <p className="empty">No transactions yet. Add money to get started.</p>;
  return <>{groups.map(([day, items]) => (
    <section key={day}>
      <h3 className="day">{day}</h3>
      {items.map((t) => (
        <div className="tx" key={t.id}>
          <div className={"dot " + t.direction}>{t.direction === "incoming" ? "↓" : "↑"}</div>
          <div className="grow"><div className="t1">{t.description}</div><div className="t2">{t.category ?? "Deposit"} · {t.status}</div></div>
          <div className={"amt " + t.direction}>{t.direction === "incoming" ? "+" : "-"}{naira(t.amount)}</div>
        </div>
      ))}
    </section>
  ))}</>;
}

function Home({ balance, txs, go }: { balance: number | null; txs: Tx[]; go: (t: Tab) => void }) {
  const [hide, setHide] = useState(false);
  return (<>
    <div className="wallet">
      <div className="row"><span>Available balance</span><button className="eye" onClick={() => setHide(!hide)}>{hide ? "Show" : "Hide"}</button></div>
      <div className="bal">{balance === null ? "…" : hide ? "₦ ••••••" : naira(balance)}</div>
      <Sim />
    </div>
    <div className="actions">
      {(["Add money", "Send", "Withdraw", "Cards"] as const).map((a) => (
        <button key={a} onClick={() => go(a === "Cards" ? "cards" : "move")}>{a}</button>
      ))}
    </div>
    <PlanCard balance={balance} />
    <h2>Recent activity</h2>
    <TxList txs={txs} />
  </>);
}

function Cards({ card, toggle }: { card: CardInfo | null; toggle: () => void }) {
  if (!card) return <p className="empty">Loading card…</p>;
  const frozen = card.status === "BLOCKED";
  return (<>
    <div className={"card" + (frozen ? " frozen" : "")}><div>{card.name}</div><div className="pan">•••• •••• •••• {card.last4}</div><div>{frozen ? "Frozen" : "Active"}</div></div>
    <Sim />
    <button className="primary" onClick={toggle}>{frozen ? "Unfreeze card" : "Freeze card"}</button>
    <p className="muted">Freezing stops every payment on this card until you unfreeze it.</p>
  </>);
}

function Insights({ txs, balance }: { txs: Tx[]; balance: number | null }) {
  const spend = txs.filter((t) => t.direction === "outgoing");
  const byCat = useMemo(() => {
    const m = new Map<string, number>();
    spend.forEach((t) => m.set(t.category ?? "Other", (m.get(t.category ?? "Other") ?? 0) + t.amount));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [spend]);
  const total = byCat.reduce((s, [, v]) => s + v, 0);
  const days = Math.max(1, Math.ceil((Date.now() - Math.min(...spend.map((t) => +new Date(t.createdAt)), Date.now())) / 864e5));
  const daily = total / days;
  const runway = balance !== null && daily > 0 ? Math.floor(balance / daily) : null;
  return (<>
    <h2>Where your money went</h2>
    {byCat.map(([c, v]) => (<div className="bar" key={c}><div className="row"><span>{c}</span><span>{naira(v)}</span></div><div className="track"><div style={{ width: `${(v / total) * 100}%` }} /></div></div>))}
    <div className="panel"><div className="t2">Your balance at this pace</div>
      <div className="acct">{runway === null ? "…" : `${runway} days`}</div>
      <div className="t2">You spend about {naira(Math.round(daily))} a day.</div><Sim /></div>
    <Coach txs={txs} balance={balance} />
  </>);
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [balance, setBalance] = useState<number | null>(null);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [acct, setAcct] = useState<DepositAccount | null>(null);
  const [card, setCard] = useState<CardInfo | null>(null);
  const refresh = () => { provider.getBalance().then(setBalance); provider.listTransactions().then(setTxs); };
  useEffect(() => {
    refresh();
    provider.getDepositAccount().then(setAcct); provider.getCard().then(setCard);
  }, []);
  const [locked, setLocked] = useState(hasPin());
  const [epoch, setEpoch] = useState(0);
  const [settings, setSettings] = useState(false);
  const toggle = () => card && provider.setCardStatus(card.status === "ACTIVE" ? "BLOCKED" : "ACTIVE").then(setCard);
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;
  return (
    <div className="app">
      <header><strong>SBMS</strong><button className="gear" aria-label="Settings" onClick={() => setSettings(true)}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg></button></header>
      <main key={epoch}>
        {settings && (<><button className="back" onClick={() => setSettings(false)}>← Back</button><h2>Settings</h2><Privacy onLock={() => hasPin() && setLocked(true)} onReset={() => { setEpoch((e) => e + 1); refresh(); }} /></>)}
        {!settings && tab === "home" && <Home balance={balance} txs={txs} go={setTab} />}
        {!settings && tab === "move" && <MovePanel acct={acct} onDone={refresh} />}
        {!settings && tab === "cards" && <Cards card={card} toggle={toggle} />}
        {!settings && tab === "insights" && <Insights txs={txs} balance={balance} />}
        {!settings && tab === "more" && <MoreTab txs={txs} onDone={refresh} />}
      </main>
      <nav>{(Object.keys(LABELS) as Tab[]).map((t) => (
        <button key={t} className={tab === t ? "on" : ""} onClick={() => { setTab(t); setSettings(false); }} aria-label={LABELS[t]}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[t]} /></svg>
          <span>{LABELS[t]}</span>
        </button>))}
      </nav>
    </div>
  );
}
