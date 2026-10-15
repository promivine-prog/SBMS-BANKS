// Creates our ONE sandbox user on B Moni and remembers it in Supabase. Safe to open twice: it reuses the stored user.
// Usage: /api/setup-user?confirm=yes            (Bunch Dillon, the default)
//        /api/setup-user?confirm=yes&persona=samson   (only if Bunch is taken by another team)
const PERSONAS: Record<string, { firstName: string; lastName: string; phoneNumber: string; bvn: string }> = {
  bunch: { firstName: "Bunch", lastName: "Dillon", phoneNumber: "+2348000000000", bvn: "95888168924" },
  samson: { firstName: "Samson", lastName: "Jabo", phoneNumber: "+2348000000001", bvn: "22222222222" },
};
// New-style sb_secret_ keys go in "apikey" only; legacy service_role JWTs also go in Authorization.
const sbAuth = (k: string) => (k.startsWith("sb_") ? { apikey: k } : { apikey: k, Authorization: `Bearer ${k}` });
export default async function handler(req: any, res: any) {
  const e = process.env;
  const persona = String(req.query?.persona ?? "bunch");
  const p = PERSONAS[persona];
  if (!p) return res.status(400).json({ error: "persona must be bunch or samson" });
  if (req.query?.confirm !== "yes") return res.status(400).json({ error: "Add ?confirm=yes to create the sandbox user." });
  const sb = { ...sbAuth(e.SUPABASE_SERVICE_KEY ?? ""), "Content-Type": "application/json" };
  const existing = await fetch(`${e.SUPABASE_URL}/rest/v1/app_users?persona=eq.${persona}&select=*`, { headers: sb });
  const rows = existing.ok ? await existing.json() : [];
  if (rows.length) return res.status(200).json({ reused: true, userId: rows[0].bmoni_user_id });

  const email = `promivine.${Math.random().toString(16).slice(2, 8)}@example.com`;
  const r = await fetch(`${e.BMONI_BASE_URL}/v1/users`, {
    method: "POST",
    headers: { "x-api-key": e.BMONI_API_KEY ?? "", "Content-Type": "application/json" },
    body: JSON.stringify({ ...p, email }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.status === 409) return res.status(409).json({ error: "This persona already exists (probably another team). Try ?persona=samson.", body });
  if (!r.ok) return res.status(r.status).json({ error: "B Moni rejected the request", body });
  const userId = body?.user?.id;
  if (!userId) return res.status(502).json({ error: "B Moni replied without user.id", body });
  const save = await fetch(`${e.SUPABASE_URL}/rest/v1/app_users`, {
    method: "POST", headers: { ...sb, Prefer: "return=minimal" },
    body: JSON.stringify({ persona, bmoni_user_id: userId, email }),
  });
  res.status(200).json({ created: true, userId, saved: save.ok, supabaseStatus: save.status });
}
