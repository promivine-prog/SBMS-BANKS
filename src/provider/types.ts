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
  createdAt: string; // ISO
}
export interface Goal { id: string; name: string; target: number; saved: number }
export interface Plan { essentials: number; cash: number; nextIncome: string | null }
export interface CardInfo { id: string; name: string; last4: string; status: "ACTIVE" | "BLOCKED" }
export interface DepositAccount { bank: string; number: string; name: string }
export interface BankingProvider {
  simulated: boolean;
  getBalance(): Promise<number>;
  listTransactions(): Promise<Tx[]>;
  getDepositAccount(): Promise<DepositAccount>;
  getCard(): Promise<CardInfo>;
  setCardStatus(status: CardInfo["status"]): Promise<CardInfo>;
  getPlan(): Promise<Plan>;
  setPlan(plan: Plan): Promise<void>;
  listGoals(): Promise<Goal[]>;
  addGoal(name: string, target: number): Promise<void>;
  contribute(goalId: string, amount: number): Promise<void>;
  getLimit(): Promise<number>;
  setLimit(weekly: number): Promise<void>;
  sendMoney(to: string, amount: number): Promise<void>;
  withdraw(bank: string, account: string, amount: number): Promise<void>;
}
