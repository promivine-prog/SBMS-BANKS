import { useState } from "react";
import { getAccount, guest, login, signup } from "./auth";
import Legal, { type DocKey } from "./Legal";
export default function AuthScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">(getAccount() ? "login" : "signup");
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [pw, setPw] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const [doc, setDoc] = useState<DocKey | null>(null);
  const submit = async () => {
    setBusy(true); setErr("");
    try { if (mode === "signup") await signup(name, email, pw, agree); else await login(email, pw); onDone(); }
    catch (e: any) { setErr(e.message ?? "Something went wrong."); }
    setBusy(false);
  };
  const up = mode === "signup";
  const links = (<><button type="button" className="linkbtn" onClick={() => setDoc("terms")}>Terms and Agreement</button> and <button type="button" className="linkbtn" onClick={() => setDoc("privacy")}>Privacy Policy</button></>);
  return (<div className="app auth">
    {doc && <Legal doc={doc} onClose={() => setDoc(null)} />}
    <h1 className="brand">SBMS</h1><p className="muted">Take control of your money.</p>
    <h2>{up ? "Create account" : "Log in"}</h2>
    {up && <input className="field" placeholder="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
    <input className="field" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input className="field" type="password" placeholder="Password (6+ characters)" autoComplete={up ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} />
    {up && <label className="agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I have read and agree to the {links}.</span></label>}
    {err && <p className="muted" role="alert">{err}</p>}
    <button className="primary" disabled={busy || (up && !agree)} onClick={submit}>{up ? "Sign up" : "Log in"}</button>
    <button className="ghost" onClick={() => { setMode(up ? "login" : "signup"); setErr(""); }}>{up ? "I already have an account" : "Create a new account"}</button>
    <button className="ghost" onClick={() => { guest(); onDone(); }}>Continue as guest (demo)</button>
    <p className="muted">By continuing as a guest you also accept the {links}.</p>
    <p className="muted">Demo account: saved only on this device, nothing is sent to a server. Do not reuse a real password.</p></div>);
}
