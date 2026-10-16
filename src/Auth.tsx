import { useState } from "react";
import { getAccount, guest, login, signup } from "./auth";
export default function AuthScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">(getAccount() ? "login" : "signup");
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr("");
    try { if (mode === "signup") await signup(name, email, pw); else await login(email, pw); onDone(); }
    catch (e: any) { setErr(e.message ?? "Something went wrong."); }
    setBusy(false);
  };
  const up = mode === "signup";
  return (<div className="app auth"><h1 className="brand">SBMS</h1><p className="muted">Take control of your money.</p>
    <h2>{up ? "Create account" : "Log in"}</h2>
    {up && <input className="field" placeholder="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
    <input className="field" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input className="field" type="password" placeholder="Password (6+ characters)" autoComplete={up ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} />
    {err && <p className="muted" role="alert">{err}</p>}
    <button className="primary" disabled={busy} onClick={submit}>{up ? "Sign up" : "Log in"}</button>
    <button className="ghost" onClick={() => { setMode(up ? "login" : "signup"); setErr(""); }}>{up ? "I already have an account" : "Create a new account"}</button>
    <button className="ghost" onClick={() => { guest(); onDone(); }}>Continue as guest (demo)</button>
    <p className="muted">Demo account: saved only on this device, nothing is sent to a server. Do not reuse a real password.</p></div>);
}
