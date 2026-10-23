import type { BankingProvider } from "./types";
import { simulatedProvider } from "./simulated";
// One switch picks the provider. The B Moni provider is added in the next build;
// until then "bmoni" falls back to simulated so screens always render.
const mode = import.meta.env.VITE_PROVIDER ?? "simulated";
export const provider: BankingProvider = mode === "simulated" ? simulatedProvider : simulatedProvider;
export type { Tx, CardInfo, DepositAccount, Category, Goal, Plan, Income, Recipient, Smoother } from "./types";
