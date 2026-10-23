import type { BankingProvider, CardInfo, Goal, Plan, Recipient, Smoother, Tx } from "./types";
const wait = <T,>(v: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(v), ms));
const ago = (days: number, hour: number) => {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(hour, 15, 0, 0); return d.toISOString();
};
// Synthetic student data only. Replaced by real B Moni calls when the "bmoni" provider is switched on.
const seed: Tx[] = [
  { id: "t1", direction: "incoming", amount: 40000, status: "completed", description: "Allowance from Mum", narrationType: "fund_bank", createdAt: ago(9, 9) },
  { id: "t2", direction: "outgoing", amount: 3500, status: "completed", description: "Campus canteen", narrationType: "card_transaction_charge", category: "Food", createdAt: ago(8, 13) },
  { id: "t3", direction: "outgoing", amount: 2000, status: "completed", description: "MTN data bundle", narrationType: "card_transaction_charge", category: "Data & airtime", createdAt: ago(7, 18) },
  { id: "t4", direction: "outgoing", amount: 1200, status: "completed", description: "Bus to campus", narrationType: "send_to_friend", category: "Transport", createdAt: ago(5, 7) },
  { id: "t5", direction: "outgoing", amount: 6500, status: "completed", description: "Course handout and printing", narrationType: "card_transaction_charge", category: "School", createdAt: ago(4, 11) },
  { id: "t6", direction: "outgoing", amount: 2800, status: "completed", description: "Jollof and chicken", narrationType: "card_transaction_charge", category: "Food", createdAt: ago(2, 14) },
  { id: "t7", direction: "outgoing", amount: 1500, status: "completed", description: "Okada to hostel", narrationType: "send_to_friend", category: "Transport", createdAt: ago(1, 20) },
  { id: "t8", direction: "outgoing", amount: 100, status: "completed", description: "Transfer fee", narrationType: "service_fee", category: "Other", createdAt: ago(1, 20) },
];
// Synthetic test card: the 0000 prefix is not a real card number range.
const testCard = (last4: string): CardInfo => ({ id: "c" + Date.now(), name: "Everyday card", last4, number: `0000 0000 0000 ${last4}`, expiry: "12/29", cvv: "000", status: "ACTIVE" });
let card: CardInfo = testCard("4821");
let weeklyLimit = 20000;
let opening = 8000;
const in9 = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
let plan: Plan = { essentials: 6000, cash: 0, nextIncome: in9, incomes: [{ id: "i1", name: "Allowance from Mum", amount: 40000, date: in9 }] };
const goals: Goal[] = [{ id: "g1", name: "New laptop", target: 150000, saved: 20000 }];
const weekSpend = () => seed.filter((t) => t.direction === "outgoing" && t.category !== "Savings" && Date.now() - +new Date(t.createdAt) < 7 * 864e5).reduce((s, t) => s + t.amount, 0);
let smoother: Smoother | null = null;
const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dayDiff = (a: string, b: string) => Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 864e5);
const shareFor = (s: Smoother, k: number) => (k >= s.days ? s.total - s.daily * (s.days - 1) : s.daily);
// Releases the daily shares that are due. Safe to call often: it only adds shares not yet released.
function syncSmoother() {
  const s = smoother; if (!s || s.status !== "active") return;
  const due = Math.min(s.days, dayDiff(s.startDay, dayStr()) + 1);
  while (s.releasedDays < due) {
    s.releasedDays++;
    const when = s.releasedDays === 1 ? new Date() : new Date(s.startDay + "T08:00:00");
    if (s.releasedDays > 1) when.setDate(when.getDate() + s.releasedDays - 1);
    seed.push({ id: "m" + s.startDay + "-" + s.releasedDays, direction: "incoming", amount: shareFor(s, s.releasedDays), status: "completed", description: `Allowance Smoother, day ${s.releasedDays} of ${s.days}`, narrationType: "fund_bank", createdAt: when.toISOString() });
  }
  if (s.releasedDays >= s.days) s.status = "completed";
}
async function spend(amount: number, description: string, narrationType: Tx["narrationType"], to?: Recipient, narration?: string, queued?: boolean): Promise<Tx> {
  if (!(amount > 0)) throw new Error("Enter an amount above ₦0.");
  if (amount > (await simulatedProvider.getBalance())) throw new Error("Not enough balance for this amount.");
  if (weekSpend() + amount > weeklyLimit) throw new Error(`This would pass your weekly limit of ₦${weeklyLimit.toLocaleString("en-NG")}. Raise it in More to continue.`);
  const tx: Tx = { id: "s" + Date.now(), direction: "outgoing", amount, status: "completed", description, narrationType, category: "Other", createdAt: new Date().toISOString(), to, narration, queued };
  seed.push(tx);
  // Bank withdrawals start Pending, like the real flow (approval and signing), then complete after a few seconds.
  if (queued) { tx.status = "pending"; } else if (narrationType === "send_to_bank") { tx.status = "pending"; setTimeout(() => { tx.status = "completed"; save(); }, 4000); }
  return tx;
}
const base: BankingProvider = {
  simulated: true,
  async getBalance() {
    syncSmoother();
    const net = seed.reduce((s, t) => s + (t.direction === "incoming" ? t.amount : -t.amount), 0);
    return wait(net + opening);
  },
  listTransactions: () => { syncSmoother(); return wait([...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))); },
  getDepositAccount: () => wait({ bank: "Sandbox Bank", number: "0123456789", name: "Bunch Dillon" }),
  getCard: () => wait(card),
  sendMoney: (to, amount, narration, queued) => spend(amount, `Sent to ${to.name}`, "send_to_friend", to, narration, queued),
  withdraw: (to, amount, narration, queued) => spend(amount, `Sent to ${to.name}`, "send_to_bank", to, narration, queued),
  async syncQueued() { const q = seed.filter((t) => t.queued); await wait(null, 1200); q.forEach((t) => { t.queued = false; t.status = "completed"; }); return q.length; },
  async getSmoother() { syncSmoother(); return smoother ? { ...smoother } : null; },
  async startSmoother(total, days) {
    syncSmoother();
    if (smoother && smoother.status === "active") throw new Error("You already have an active Allowance Smoother.");
    if (!(total > 0)) throw new Error("Enter an amount above ₦0.");
    if (!Number.isInteger(days) || days < 2 || days > 60) throw new Error("Choose between 2 and 60 days.");
    if (Math.floor(total / days) < 1) throw new Error("That amount is too small for that many days.");
    if (total > (await simulatedProvider.getBalance())) throw new Error("Not enough balance for this amount.");
    const made: Smoother = { total, days, daily: Math.floor(total / days), releasedDays: 0, startDay: dayStr(), status: "active" };
    smoother = made;
    seed.push({ id: "ml" + Date.now(), direction: "outgoing", amount: total, status: "completed", description: `Locked in Allowance Smoother (${days} days)`, narrationType: "send_to_friend", category: "Savings", createdAt: new Date().toISOString() });
    syncSmoother();
    return { ...made };
  },
  async breakSmoother() {
    syncSmoother();
    const s = smoother;
    if (!s || s.status !== "active") throw new Error("There is no active Allowance Smoother.");
    const left = s.total - (s.releasedDays >= s.days ? s.total : s.daily * s.releasedDays);
    if (left > 0) seed.push({ id: "mb" + Date.now(), direction: "incoming", amount: left, status: "completed", description: "Allowance Smoother, emergency break", narrationType: "fund_bank", createdAt: new Date().toISOString() });
    s.status = "broken";
    return { ...s };
  },
  async clearSmoother() { if (smoother && smoother.status !== "active") smoother = null; },
  async reset() { seed.length = 0; goals.length = 0; opening = 0; weeklyLimit = 20000; plan = { essentials: 0, cash: 0, nextIncome: null, incomes: [] }; smoother = null; },
  getPlan: () => wait({ ...plan }, 150),
  async setPlan(p) { if (p.essentials < 0 || p.cash < 0) throw new Error("Amounts cannot be negative."); plan = { ...p }; },
  listGoals: () => wait(goals.map((g) => ({ ...g })), 200),
  async addGoal(name, target) { if (!name.trim() || !(target > 0)) throw new Error("Give the goal a name and a target above ₦0."); goals.push({ id: "g" + Date.now(), name: name.trim(), target, saved: 0 }); },
  async contribute(goalId, amount) {
    const g = goals.find((x) => x.id === goalId);
    if (!g) throw new Error("Goal not found.");
    if (!(amount > 0)) throw new Error("Enter an amount above ₦0.");
    if (amount > (await simulatedProvider.getBalance())) throw new Error("Not enough balance for this amount.");
    g.saved += amount;
    seed.push({ id: "s" + Date.now(), direction: "outgoing", amount, status: "completed", description: `Saved to ${g.name}`, narrationType: "send_to_friend", category: "Savings", createdAt: new Date().toISOString() });
  },
  getLimit: () => wait(weeklyLimit, 150),
  async setLimit(weekly) { if (!(weekly > 0)) throw new Error("Limit must be above ₦0."); weeklyLimit = weekly; },
  issueCard() { card = testCard(String(1000 + Math.floor(Math.random() * 9000))); return wait(card, 600); },
  setCardStatus: (status) => { card = { ...card, status }; return wait(card, 250); },
};

// Offline support: the simulated data is saved on this device so it survives a reload.
const SKEY = "sbms_sim_v1";
function save() { try { localStorage.setItem(SKEY, JSON.stringify({ seed, goals, card, weeklyLimit, opening, plan, smoother })); } catch { /* storage unavailable */ } }
function loadSaved() {
  try {
    const raw = localStorage.getItem(SKEY); if (!raw) return;
    const s = JSON.parse(raw);
    seed.splice(0, seed.length, ...s.seed); goals.splice(0, goals.length, ...s.goals);
    card = s.card; weeklyLimit = s.weeklyLimit; opening = s.opening; plan = s.plan; smoother = s.smoother ?? null;
    seed.forEach((t) => { if (t.status === "pending" && !t.queued && Date.now() - +new Date(t.createdAt) > 4000) t.status = "completed"; });
  } catch { /* ignore unreadable saved data */ }
}
const MUTATORS = ["sendMoney", "withdraw", "contribute", "addGoal", "setLimit", "setPlan", "setCardStatus", "issueCard", "syncQueued", "startSmoother", "breakSmoother", "clearSmoother", "reset"] as const;
export const simulatedProvider: BankingProvider = { ...base };
for (const m of MUTATORS) { const f = (base as any)[m]; (simulatedProvider as any)[m] = async (...a: any[]) => { const r = await f(...a); save(); return r; }; }
loadSaved();
