import { hash } from "./pin";
// Payment PIN: approves every transfer. Salted hash in this browser only; never sent anywhere.
const KEY = "sbms_paypin";
export const hasPayPin = () => { try { return !!localStorage.getItem(KEY); } catch { return false; } };
export async function setPayPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("Payment PIN must be 4 digits.");
  const salt = crypto.randomUUID();
  try { localStorage.setItem(KEY, JSON.stringify({ salt, h: await hash(pin, salt) })); } catch { throw new Error("This browser blocked saving the PIN."); }
}
export async function checkPayPin(pin: string) {
  try { const o = JSON.parse(localStorage.getItem(KEY) ?? ""); return o.h === (await hash(pin, o.salt)); } catch { return false; }
}
export const clearPayPin = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
