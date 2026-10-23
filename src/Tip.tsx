import { useState } from "react";
import { earn, getProfile } from "./rank";
const TIPS = [
  "Write down what you spend for three days. You cannot plan what you cannot see.",
  "Pay for essentials first: food, transport and data. Then choose your wants.",
  "Even ₦200 a day adds up to ₦6,000 in a month. Small amounts matter.",
  "Wait 24 hours before buying something you did not plan to buy.",
  "A real bank never asks for your PIN or OTP. If someone does, hang up.",
  "Keep a small emergency amount that you do not touch for wants.",
  "If your allowance may be late, tell the sender early so you can plan.",
  "Compare prices before buying data or airtime. A bundle can cost less per day.",
  "Check the account name before you send money. A name that does not match is a warning sign.",
  "A promise to double your money in days is almost always a scam.",
  "Set your weekly limit when you are calm, so tired or hungry you has a rule to follow.",
  "Spend two minutes reviewing last week: what was worth it, and what was not?",
  "Save first, even a little, then spend what is left.",
  "Split shared costs, like printing or a generator charge, and write down who paid.",
];
export default function Tip() {
  const day = Math.floor((Date.now() + 3600000) / 864e5); // Nigeria time
  const tip = TIPS[day % TIPS.length];
  const [done, setDone] = useState(() => { try { return localStorage.getItem("sbms_tip_day") === String(day); } catch { return false; } });
  const joined = !!getProfile();
  const got = () => { setDone(true); try { localStorage.setItem("sbms_tip_day", String(day)); } catch { /* ignore */ } earn("daily_tip"); };
  return (<div className="panel"><div className="row"><strong>Tip of the day</strong><span className="sim">1 minute</span></div>
    <p>{tip}</p>
    {done ? <p className="muted">Read today. Come back tomorrow for a new one.</p> : <button className="ghost" onClick={got}>{joined ? "Got it (+5 points)" : "Got it"}</button>}</div>);
}
