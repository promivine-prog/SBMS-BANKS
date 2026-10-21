import type { Tx } from "./provider";
export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");
export const statusLabel = (t: Tx) => (t.status === "pending" ? (t.queued ? "⏳ Queued (offline)" : "⏳ Pending") : t.direction === "incoming" ? "✓ Received" : "✓ Sent");
export const typeLabel = (t: Tx) => ({ fund_bank: "Deposit", send_to_bank: "Bank withdrawal", send_to_friend: "Transfer", card_transaction_charge: "Card payment", service_fee: "Fee" })[t.narrationType];
// Demo reference derived from the transaction. Real B Moni transaction IDs replace this when the live provider is connected.
export const refOf = (t: Tx) => "SBMS-" + t.createdAt.slice(0, 10).replace(/-/g, "") + "-" + t.id.replace(/[^A-Za-z0-9]/g, "").toUpperCase().padStart(6, "0").slice(-6);
