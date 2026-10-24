import type { BankingProvider, CardInfo, Goal, Plan, Bill, Recipient, Smoother, Tx, Vault } from "./types";
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
let vault: Vault | null = null;
const FAR = "9999-99-99";
const unpaidByDue = (v: Vault) => v.bills.filter((b) => !b.paid).sort((a, b) => (a.due ?? FAR).localeCompare(b.due ?? FAR));
const billsNeed = (v: Vault) => v.bills.filter((b) => !b.paid).reduce((s, b) => s + (b.amount - b.locked), 0);
const okDate = (d: unknown) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
function cleanBill(b: { name: string; amount: number; due?: string | null }): Bill {
  const name = String(b.name ?? "").trim();
  if (!name || name.length > 30) throw new Error("Give the bill a name of up to 30 characters.");
  if (!Number.isInteger(b.amount) || b.amount <= 0) throw new Error("The bill amount must be a whole number above ₦0.");
  if (b.due && !okDate(b.due)) throw new Error("Choose a valid due date, or leave it empty.");
  return { id: "b" + Date.now() + Math.floor(Math.random() * 1000), name, amount: b.amount, due: b.due || null, locked: 0, paid: false };
}
// Old saved vaults had two fixed fees. They are converted into a list of bills so nothing is lost.
function migrateVault(v: any): Vault | null {
  if (!v) return null;
  if (Array.isArray(v.bills)) return { threshold: 0, ...v };
  let left: number = v.feesLocked ?? 0; const bills: Bill[] = [];
  for (const [name, amount] of [["Tuition", v.tuition ?? 0], ["Accommodation", v.accommodation ?? 0]] as [string, number][]) {
    if (amount > 0) { const locked = Math.min(left, amount); left -= locked; bills.push({ id: "b" + bills.length, name, amount, due: null, locked, paid: v.feesStatus === "PAID", ref: v.feesRef, paidAt: v.feesPaidAt }); }
  }
  const { tuition, accommodation, feesLocked, feesStatus, feesRef, feesPaidAt, ...rest } = v;
  return { ...rest, bills, threshold: 0 } as Vault;
}
const nextDay = (d: string) => { const x = new Date(d + "T00:00:00"); x.setDate(x.getDate() + 1); return dayStr(x); };
function vaultCalc(v: Vault) {
  const t = dayStr();
  v.daysLeft = t > v.endDay ? 0 : dayDiff(t, v.endDay) + 1;
  v.drip = v.poolRemaining <= 0 ? 0 : v.daysLeft <= 1 ? v.poolRemaining : Math.floor(v.poolRemaining / v.daysLeft);
}
function vaultRelease(v: Vault, amt: number, day: string) {
  v.poolRemaining -= amt;
  seed.push({ id: "vd" + day, direction: "incoming", amount: amt, status: "completed", description: `Vault daily allowance, ${day}`, narrationType: "fund_bank", createdAt: day === dayStr() ? new Date().toISOString() : new Date(day + "T08:00:00").toISOString() });
}
// The "midnight drip", done as a catch-up by date: every day that has passed since the last release is released in order,
// so it also works after the app was closed or offline. Each day's share is recalculated from what is left.
function syncVault() {
  const v = vault; if (!v) return;
  if (v.status === "active") {
    const t = dayStr(); let d = v.lastDripDay ? nextDay(v.lastDripDay) : t;
    while (d <= t && v.poolRemaining > 0) {
      if (d > v.endDay) { vaultRelease(v, v.poolRemaining, d); v.lastDripDay = d; break; }
      const left = dayDiff(d, v.endDay) + 1, amt = left <= 1 ? v.poolRemaining : Math.floor(v.poolRemaining / left);
      if (amt > 0) vaultRelease(v, amt, d);
      v.lastDripDay = d; d = nextDay(d);
    }
    if (v.poolRemaining <= 0) v.status = "done";
  }
  vaultCalc(v);
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
    syncSmoother(); syncVault();
    const net = seed.reduce((s, t) => s + (t.direction === "incoming" ? t.amount : -t.amount), 0);
    return wait(net + opening);
  },
  listTransactions: () => { syncSmoother(); syncVault(); return wait([...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))); },
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
  async getVault() { syncVault(); return vault ? { ...vault } : null; },
  async setupVault(cfg) {
    syncVault();
    if (vault && vault.received > 0 && vault.status !== "done") throw new Error("You already have a vault holding money.");
    if (!okDate(cfg.startDay) || !okDate(cfg.endDay)) throw new Error("Choose the semester start and end dates.");
    if (cfg.endDay < cfg.startDay) throw new Error("The end date must be after the start date.");
    if (cfg.endDay < dayStr()) throw new Error("The semester end date has already passed.");
    if (dayDiff(cfg.startDay, cfg.endDay) > 400) throw new Error("A semester cannot be longer than 400 days.");
    if (cfg.bills.length > 12) throw new Error("Add at most 12 bills.");
    if (!Number.isInteger(cfg.threshold) || cfg.threshold < 0) throw new Error("The big deposit amount must be 0 or more.");
    const v: Vault = { bills: cfg.bills.map(cleanBill), threshold: cfg.threshold, startDay: cfg.startDay, endDay: cfg.endDay, received: 0, poolTotal: 0, poolRemaining: 0, lastDripDay: null, status: "ready", daysLeft: 0, drip: 0 };
    vaultCalc(v); vault = v; return { ...v };
  },
  async addBill(bill) {
    syncVault(); const v = vault; if (!v) throw new Error("Set up your semester vault first.");
    if (v.status === "done") throw new Error("This semester has finished.");
    if (v.bills.length >= 12) throw new Error("Add at most 12 bills.");
    v.bills.push(cleanBill(bill)); return { ...v };
  },
  async removeBill(id) {
    syncVault(); const v = vault; if (!v) throw new Error("Set up your semester vault first.");
    const b = v.bills.find((x) => x.id === id); if (!b) throw new Error("Bill not found.");
    if (b.locked > 0) throw new Error("This bill already holds locked money. Pay it with an invoice reference first.");
    v.bills = v.bills.filter((x) => x.id !== id); return { ...v };
  },
  async payBill(id, reference) {
    syncVault(); const v = vault; if (!v) throw new Error("Set up your semester vault first.");
    const b = v.bills.find((x) => x.id === id); if (!b) throw new Error("Bill not found.");
    if (b.paid) throw new Error("This bill is already marked as paid.");
    if (b.locked < b.amount) throw new Error("The full amount is not locked yet.");
    if (!/^[A-Za-z0-9-]{6,24}$/.test(reference.trim())) throw new Error("Enter the invoice reference: 6 to 24 letters, numbers or dashes.");
    // SIMULATED check. A real product would verify the invoice with the school or a licensed payment partner.
    b.paid = true; b.ref = reference.trim().toUpperCase(); b.paidAt = new Date().toISOString();
    return { ...v };
  },
  async setThreshold(threshold) {
    syncVault(); const v = vault; if (!v) throw new Error("Set up your semester vault first.");
    if (!Number.isInteger(threshold) || threshold < 0) throw new Error("The big deposit amount must be 0 or more.");
    v.threshold = threshold; return { ...v };
  },
  async receiveInflow(amount, narration, bulk) {
    syncVault();
    if (!(amount > 0)) throw new Error("Enter an amount above ₦0.");
    const v0 = vault;
    const reason = /NELFUND|LOAN/i.test(narration) ? "keyword" : v0 && v0.threshold > 0 && amount >= v0.threshold ? "threshold" : bulk ? "manual" : null;
    const now = new Date().toISOString();
    if (reason && !v0) throw new Error("Set up your semester vault first.");
    seed.push({ id: "vi" + Date.now(), direction: "incoming", amount, status: "completed", description: narration.trim() || "Incoming transfer", narrationType: "fund_bank", createdAt: now });
    const v = vault;
    if (!reason || !v) return { detected: false, reason: null, vault: v ? { ...v } : null };
    // Fill the bills in due-date order, locking only what each one still needs, so a second arrival never locks the same bill twice.
    let left = amount, toFees = 0;
    for (const b of unpaidByDue(v)) { const x = Math.min(b.amount - b.locked, left); if (x > 0) { b.locked += x; left -= x; toFees += x; } }
    const toPool = left;
    v.received += amount; v.poolTotal += toPool; v.poolRemaining += toPool;
    if (toFees > 0) seed.push({ id: "vf" + Date.now(), direction: "outgoing", amount: toFees, status: "completed", description: "Locked for bills (vault)", narrationType: "send_to_friend", category: "Savings", createdAt: now });
    if (toPool > 0) {
      seed.push({ id: "vp" + Date.now(), direction: "outgoing", amount: toPool, status: "completed", description: "Moved to upkeep pool (vault)", narrationType: "send_to_friend", category: "Savings", createdAt: now });
      v.status = "active";
      const t = dayStr();
      if (v.lastDripDay !== t) { // today's share arrives straight away
        const days = t > v.endDay ? 1 : dayDiff(t, v.endDay) + 1, amt = days <= 1 ? v.poolRemaining : Math.floor(v.poolRemaining / days);
        if (amt > 0) vaultRelease(v, amt, t);
        v.lastDripDay = t;
      }
    }
    syncVault();
    return { detected: true, reason, vault: { ...v } };
  },
  async clearVault() {
    syncVault();
    if (vault && vault.status !== "done" && vault.received > 0) throw new Error("Your vault still holds money.");
    if (vault && vault.bills.some((b) => !b.paid && b.locked > 0)) throw new Error("Pay your locked bills with an invoice reference first.");
    vault = null;
  },
  async reset() { seed.length = 0; goals.length = 0; opening = 0; weeklyLimit = 20000; plan = { essentials: 0, cash: 0, nextIncome: null, incomes: [] }; smoother = null; vault = null; },
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
function save() { try { localStorage.setItem(SKEY, JSON.stringify({ seed, goals, card, weeklyLimit, opening, plan, smoother, vault })); } catch { /* storage unavailable */ } }
function loadSaved() {
  try {
    const raw = localStorage.getItem(SKEY); if (!raw) return;
    const s = JSON.parse(raw);
    seed.splice(0, seed.length, ...s.seed); goals.splice(0, goals.length, ...s.goals);
    card = s.card; weeklyLimit = s.weeklyLimit; opening = s.opening; plan = s.plan; smoother = s.smoother ?? null; vault = migrateVault(s.vault);
    seed.forEach((t) => { if (t.status === "pending" && !t.queued && Date.now() - +new Date(t.createdAt) > 4000) t.status = "completed"; });
  } catch { /* ignore unreadable saved data */ }
}
const MUTATORS = ["sendMoney", "withdraw", "contribute", "addGoal", "setLimit", "setPlan", "setCardStatus", "issueCard", "syncQueued", "startSmoother", "breakSmoother", "clearSmoother", "setupVault", "addBill", "removeBill", "payBill", "setThreshold", "receiveInflow", "clearVault", "reset"] as const;
export const simulatedProvider: BankingProvider = { ...base };
for (const m of MUTATORS) { const f = (base as any)[m]; (simulatedProvider as any)[m] = async (...a: any[]) => { const r = await f(...a); save(); return r; }; }
loadSaved();
