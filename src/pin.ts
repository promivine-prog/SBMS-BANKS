// Device-only convenience lock. The PIN is salted and hashed in this browser's storage and never sent anywhere.
const KEY = "sbms_pin";
export const hash = async (pin: string, salt: string) => {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pin));
  return Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join("");
};
export const hasPin = () => { try { return !!localStorage.getItem(KEY); } catch { return false; } };
export async function setPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) throw new Error("PIN must be 4 digits.");
  const salt = crypto.randomUUID();
  try { localStorage.setItem(KEY, JSON.stringify({ salt, h: await hash(pin, salt) })); } catch { throw new Error("This browser blocked saving the PIN."); }
}
export async function checkPin(pin: string) {
  try { const o = JSON.parse(localStorage.getItem(KEY) ?? ""); return o.h === (await hash(pin, o.salt)); } catch { return false; }
}
export const clearPin = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } };
