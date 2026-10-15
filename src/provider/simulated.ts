import type { BankingProvider, CardInfo, Tx } from "./types";
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
export const simulatedProvider: BankingProvider = {
  simulated: true,
  async getBalance() {
    const net = seed.reduce((s, t) => s + (t.direction === "incoming" ? t.amount : -t.amount), 0);
    return wait(net + 8000);
  },
  listTransactions: () => wait([...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  getDepositAccount: () => wait({ bank: "Sandbox Bank", number: "0123456789", name: "Bunch Dillon" }),
  getCard: () => wait(card),
  setCardStatus: (status) => { card = { ...card, status }; return wait(card, 250); },
};
