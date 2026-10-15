import { useState } from "react";
interface Lesson { title: string; body: string; q: string; options: string[]; answer: number }
const LESSONS: Lesson[] = [
  { title: "Pay yourself first", body: "When money arrives, set aside a small fixed amount before you spend. Even ₦500 a week adds up to ₦26,000 in a year.",
    q: "Your allowance just arrived. What do you do first?", options: ["Spend on fun", "Set aside your savings amount", "Lend it to friends"], answer: 1 },
  { title: "Needs and wants", body: "Needs keep you going: food, transport to class, data for study. Wants are nice to have and can wait. Cover needs first, then choose wants on purpose.",
    q: "Which is usually a want, not a need?", options: ["Textbook", "Rent", "New sneakers", "Transport to class"], answer: 2 },
  { title: "Spot a scam", body: "A real bank never asks for your PIN, OTP or full card number. Messages that rush you or say you won something are red flags.",
    q: "A caller says they are from your bank and asks for your OTP. What do you do?", options: ["Give it quickly", "Hang up and call your bank's official number", "Send it by text instead"], answer: 1 },
  { title: "A small emergency cushion", body: "Start with one week of essentials set aside, then grow towards a month. It keeps a surprise cost from becoming a debt.",
    q: "Why keep an emergency cushion?", options: ["To spend on sales", "So a surprise cost does not force you to borrow", "To lend out"], answer: 1 },
  { title: "Too good to be true", body: "Anyone promising to double your money in days is almost always running a scam. Real investments carry risk and take time.",
    q: "Someone promises to double your money in a week. Best response?", options: ["Send a small test amount", "Treat it as a likely scam and do not send money", "Tell friends to join"], answer: 1 },
];
export default function Learn() {
  const [picked, setPicked] = useState<Record<number, number>>({});
  return (<>
    <h2>Learn</h2>
    {LESSONS.map((l, i) => (
      <details className="panel" key={l.title}>
        <summary>{l.title}</summary>
        <p>{l.body}</p>
        <div className="t1">{l.q}</div>
        {l.options.map((o, j) => {
          const done = picked[i] !== undefined;
          const cls = done ? (j === l.answer ? " good" : j === picked[i] ? " bad" : "") : "";
          return <button key={o} className={"opt" + cls} disabled={done} onClick={() => setPicked({ ...picked, [i]: j })}>{o}</button>;
        })}
        {picked[i] !== undefined && <p className="muted" role="status">{picked[i] === l.answer ? "Correct." : `Not quite. The answer is: ${l.options[l.answer]}.`}</p>}
      </details>))}
  </>);
}
