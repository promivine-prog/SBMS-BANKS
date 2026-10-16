import { useState } from "react";
import { checkPin } from "./pin";
export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const change = async (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4); setPin(d); setErr("");
    if (d.length === 4) { if (await checkPin(d)) onUnlock(); else { setErr("Wrong PIN. Try again."); setPin(""); } }
  };
  return (<div className="app lock"><h2>SBMS is locked</h2><p className="muted">Enter your 4-digit PIN.</p>
    <input className="field pin" type="password" inputMode="numeric" autoFocus aria-label="PIN" value={pin} onChange={(e) => change(e.target.value)} />
    {err && <p className="muted" role="alert">{err}</p>}
    <p className="muted">This lock protects the screen on this device. Forgot it? Clear this site's data in your browser settings.</p></div>);
}
