import { useState } from "react";
const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
// Hypothetical growth only. Not advice, not a promise: real returns vary and can be negative.
export default function Simulator() {
  const [start, setStart] = useState("10000"), [monthly, setMonthly] = useState("2000"), [rate, setRate] = useState("10"), [years, setYears] = useState("3");
  const s = +start || 0, m = +monthly || 0, r = (+rate || 0) / 100, y = Math.min(30, +years || 0);
  let bal = s;
  for (let i = 0; i < y * 12; i++) bal = bal * (1 + r / 12) + m;
  const put = s + m * y * 12;
  const num = (v: string, set: (x: string) => void, label: string) => <input className="field" aria-label={label} placeholder={label} inputMode="numeric" value={v} onChange={(e) => set(e.target.value.replace(/\D/g, ""))} />;
  return (<>
    <h2>Savings simulator</h2>
    <div className="panel">
      {num(start, setStart, "Starting amount (₦)")}{num(monthly, setMonthly, "Added each month (₦)")}{num(rate, setRate, "Yearly return (%)")}{num(years, setYears, "Years (up to 30)")}
      <div className="row"><span>You put in</span><span>{naira(put)}</span></div>
      <div className="row"><strong>Hypothetical value</strong><strong>{naira(bal)}</strong></div>
      <p className="muted">Hypothetical only. Not a promise or advice. Real returns vary and can be negative. No real money is used.</p>
    </div>
  </>);
}
