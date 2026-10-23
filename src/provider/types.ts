// Shape mirrors B Moni's wallet transaction fields (direction, amount, status, narrationType).
export type Category = "Food" | "Transport" | "Data & airtime" | "School" | "Savings" | "Other";
export interface Tx {
  id: string;
  direction: "incoming" | "outgoing";
  amount: number; // naira, absolute
  status: "completed" | "pending";
  description: string;
  narrationType: "fund_bank" | "send_to_bank" | "send_to_friend" | "card_transaction_charge" | "service_fee";
  category?: Category;
  narration?: string;
  to?: Recipient;
  queued?: boolean;
  createdAt: string; // ISO
}
export interface Goal { id: string; name: string; target: number; saved: number }
export interface Income { id: string; name: string; amount: number; date: string }
export interface Plan { essentials: number; cash: number; nextIncome: string | null; incomes: Income[] }
export interface Recipient { name: string; account: string; bank: string }
export interface Smoother { total: number; days: number; daily: number; releasedDays: number; startDay: string; status: "active" | "completed" | "broken" }
export interface CardInfo { id: string; name: string; last4: string; number: string; expiry: string; cvv: string; status: "ACTIVE" | "BLOCKED" }
export interface DepositAccount { bank: string; number: string; name: string }
export interface BankingProvider {
  simulated: boolean;
  getBalance(): Promise<number>;
  listTransactions(): Promise<Tx[]>;
  getDepositAccount(): Promise<DepositAccount>;
  getCard(): Promise<CardInfo>;
  issueCard(): Promise<CardInfo>;
  setCardStatus(status: CardInfo["status"]): Promise<CardInfo>;
  reset(): Promise<void>;
  getPlan(): Promise<Plan>;
  setPlan(plan: Plan): Promise<void>;
  listGoals(): Promise<Goal[]>;
  addGoal(name: string, target: number): Promise<void>;
  contribute(goalId: string, amount: number): Promise<void>;
  getLimit(): Promise<number>;
  setLimit(weekly: number): Promise<void>;
  sendMoney(to: Recipient, amount: number, narration?: string, queued?: boolean): Promise<Tx>;
  withdraw(to: Recipient, amount: number, narration?: string, queued?: boolean): Promise<Tx>;
  syncQueued(): Promise<number>;
  getSmoother(): Promise<Smoother | null>;
  startSmoother(total: number, days: number): Promise<Smoother>;
  breakSmoother(): Promise<Smoother>;
  clearSmoother(): Promise<void>;
}
