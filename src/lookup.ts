// SIMULATED name lookup with synthetic names. The real B Moni flow verifies the account with its bank-account verification call.
export const BANKS = ["Access Bank", "GTBank", "UBA", "Zenith Bank", "First Bank", "Opay"];
const NAMES = ["Chinedu Okafor", "Aisha Bello", "Tunde Adeyemi", "Ngozi Eze", "Ibrahim Musa", "Funke Adebayo", "Emeka Nwosu", "Zainab Yusuf", "Segun Ojo", "Blessing Udoh", "Kelechi Obi", "Halima Danjuma"];
export type Lookup = { ok: true; name: string } | { ok: false; error: string };
export async function lookup(kind: "sbms" | "bank", _bank: string, acct: string, offline = false, known?: string): Promise<Lookup> {
  // Offline, an account cannot be verified, so only people you have paid before can be used.
  if (offline) return known ? { ok: true, name: known } : { ok: false, error: "You are offline. You can only send to people you have paid before." };
  await new Promise((r) => setTimeout(r, 500));
  if (!/^\d{10}$/.test(acct)) return { ok: false, error: "Account number must be 10 digits." };
  if (acct === "0123456789") return { ok: false, error: "That is your own account." };
  if (kind === "sbms" && !acct.startsWith("20")) return { ok: false, error: "No SBMS account found. Demo SBMS accounts start with 20." };
  const i = [...acct].reduce((s, c) => s + c.charCodeAt(0) * 7, 0) % NAMES.length;
  return { ok: true, name: NAMES[i].toUpperCase() };
}
