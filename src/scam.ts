import type { Tx } from "./provider";
export type Level = "LOW" | "MEDIUM" | "HIGH";
const FLAGS = /(prize|winner|\bwon\b|bonus|loan|double|invest|bitcoin|crypto|urgent|officer|support|agent|verify|refund|lottery|giveaway|grant)/i;
// Rule-based safety floor: the AI may raise the risk level but never lower it below this.
export function localScam(to: string, amount: number, balance: number, txs: Tx[]): { level: Level; reason: string } {
  if (FLAGS.test(to)) return { level: "HIGH", reason: "The name matches common scam wording (prizes, loans, support agents or investments). Real banks and friends do not ask for money this way." };
  const out = txs.filter((t) => t.direction === "outgoing");
  const avg = out.length ? out.reduce((s, t) => s + t.amount, 0) / out.length : 0;
  const known = txs.some((t) => t.description.toLowerCase() === `sent to ${to.trim().toLowerCase()}`);
  const bits: string[] = []; let score = 0;
  if (balance > 0 && amount >= balance * 0.5) { score += 2; bits.push("it is half or more of your balance"); }
  if (avg > 0 && amount >= 2 * avg) { score += 1; bits.push("it is over twice your usual payment"); }
  if (!known) { score += 1; bits.push("you have not sent to this person before"); }
  const level: Level = score >= 3 ? "HIGH" : score >= 1 ? "MEDIUM" : "LOW";
  return { level, reason: bits.length ? `Heads up: ${bits.join(", ")}. Confirm you know this person before you send.` : "This looks like your normal spending to someone you have paid before." };
}
