import type { BankingProvider, CardInfo, Goal, Tx } from "./types";
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
let card: CardInfo = { id: "c1", name: "Everyday card", last4: "4821", status: "ACTIVE" };
let weeklyLimit = 20000;
const goals: Goal[] = [{ id: "g1", name: "New laptop", target: 150000, saved: 20000 }];
const weekSpend = () => seed.filter((t) => t.direction === "outgoing" && t.category !== "Savings" && Date.now() - +new Date(t.createdAt) < 7 * 864e5).reduce((s, t) => s + t.amount, 0);
async function spend(amount: number, description: string, narrationType: Tx["narrationType"]) {
  if (!(amount > 0)) throw new Error("Enter an amount above ₦0.");
  if (amount > (await simulatedProvider.getBalance())) throw new Error("Not enough balance for this amount.");
  if (weekSpend() + amount > weeklyLimit) throw new Error(`This would pass your weekly limit of ₦${weeklyLimit.toLocaleString("en-NG")}. Raise it in More to continue.`);
  seed.push({ id: "s" + Date.now(), direction: "outgoing", amount, status: "completed", description, narrationType, category: "Other", createdAt: new Date().toISOString() });
}
export const simulatedProvider: BankingProvider = {
  simulated: true,
  async getBalance() {
    const net = seed.reduce((s, t) => s + (t.direction === "incoming" ? t.amount : -t.amount), 0);
    return wait(net + 8000);
  },
  listTransactions: () => wait([...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  getDepositAccount: () => wait({ bank: "Sandbox Bank", number: "0123456789", name: "Bunch Dillon" }),
  getCard: () => wait(card),
  sendMoney: (to, amount) => spend(amount, `Sent to ${to}`, "send_to_friend"),
  withdraw: (bank, account, amount) => spend(amount, `Withdrawal to ${bank} ••${account.slice(-4)}`, "send_to_bank"),
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
  setCardStatus: (status) => { card = { ...card, status }; return wait(card, 250); },
};
