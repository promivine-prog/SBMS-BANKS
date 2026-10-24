import { useState } from "react";
import VaultPanel from "./VaultPanel";
import SmootherPanel from "./Smoother";
// One feature, two modes: the same idea (lock money now, get it back in equal daily amounts).
export default function VaultHub({ onDone }: { onDone: () => void }) {
  const [tab, setTab] = useState<"semester" | "smoother">("semester");
  return (<>
    <h2>Vault</h2>
    <div className="chips">
      <button className={tab === "semester" ? "on" : ""} onClick={() => setTab("semester")}>Semester vault</button>
      <button className={tab === "smoother" ? "on" : ""} onClick={() => setTab("smoother")}>Allowance Smoother</button>
    </div>
    <p className="muted">One idea, two ways to use it: lock money now and get it back in equal daily amounts. Use the semester vault for a big arrival that includes school fees. Use the Allowance Smoother for any amount over a few days.</p>
    {tab === "semester" ? <VaultPanel onDone={onDone} /> : <SmootherPanel onDone={onDone} />}
  </>);
}
