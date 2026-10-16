import { hash } from "./pin";
// DEMO accounts: stored only in this browser (salted hash). Nothing is sent to a server.
const ACC = "sbms_account", SES = "sbms_session";
interface Account { name: string; email: string; salt: string; h: string; agreedAt?: string; termsVersion?: string }
export const getAccount = (): Account | null => { try { return JSON.parse(localStorage.getItem(ACC) ?? "null"); } catch { return null; } };
export const isSignedIn = () => { try { return !!sessionStorage.getItem(SES); } catch { return false; } };
const start = (v: string) => { try { sessionStorage.setItem(SES, v); } catch { /* ignore */ } };
export async function signup(name: string, email: string, password: string, agreed: boolean) {
  if (!agreed) throw new Error("Please accept the Terms and Agreement and the Privacy Policy to continue.");
  if (!name.trim()) throw new Error("Enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  const salt = crypto.randomUUID();
  try { localStorage.setItem(ACC, JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), salt, h: await hash(password, salt), agreedAt: new Date().toISOString(), termsVersion: "1" })); }
  catch { throw new Error("This browser blocked saving the account."); }
  start("user");
}
export async function login(email: string, password: string) {
  const a = getAccount();
  if (!a || a.email !== email.trim().toLowerCase() || a.h !== (await hash(password, a.salt))) throw new Error("Email or password is wrong.");
  start("user");
}
export const guest = () => start("guest");
export const logout = () => { try { sessionStorage.removeItem(SES); } catch { /* ignore */ } };
export const displayName = () => { try { if (sessionStorage.getItem(SES) === "guest") return "Guest"; } catch { /* ignore */ } return getAccount()?.name ?? "Guest"; };
