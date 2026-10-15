import type { Tx } from "./provider";
const fmt = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
// Rule-based answers used when the AI key is not set or the AI call fails. Always labelled in the UI.
export function localCoach(q: string, balance: number, txs: Tx[]): string {
  const out = txs.filter((t) => t.direction === "outgoing");
  const total = out.reduce((s, t) => s + t.amount, 0);
  const first = Math.min(...out.map((t) => +new Date(t.createdAt)), Date.now());
  const daily = total / Math.max(1, Math.ceil((Date.now() - first) / 864e5));
  const amt = q.replace(/,/g, "").match(/(\d{3,})/);
  if (/afford|buy|pay/i.test(q) && amt) {
    const left = balance - +amt[1];
    if (left < 0) return `That is more than your ${fmt(balance)} balance. Wait for your next allowance or pick something smaller.`;
    const days = daily > 0 ? Math.floor(left / daily) : null;
    return `You can pay ${fmt(+amt[1])} and keep ${fmt(left)}.` + (days !== null ? ` At about ${fmt(daily)} a day, that lasts ${days} days.${days < 7 ? " That is under a week, so only buy it if it is essential." : ""}` : "");
  }
  if (/suspicious|scam|fraud|safe/i.test(q)) {
    const avg = total / Math.max(1, out.length);
    const odd = out.filter((t) => t.amount >= 2 * avg).sort((a, b) => b.amount - a.amount)[0];
    return odd ? `Check "${odd.description}" for ${fmt(odd.amount)}. It is more than twice your usual payment. If you do not recognise it, freeze your card.` : "Nothing looks unusual. All payments are close to your normal spending.";
  }
  const cats = new Map<string, number>();
  out.forEach((t) => cats.set(t.category ?? "Other", (cats.get(t.category ?? "Other") ?? 0) + t.amount));
  const top = [...cats.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} is your biggest spend at ${fmt(top[1])}. Cutting it by a fifth would save about ${fmt(top[1] / 5)}.` : "Add some spending first and I can find where to save.";
}
