declare const process: any; // Node global; avoids needing @types/node
// Open /api/smoke in a browser. Read-only: reports which settings exist and whether B Moni and Supabase answer.
// It never returns any key values.
// New-style sb_secret_ keys go in "apikey" only; legacy service_role JWTs also go in Authorization.
const sbAuth = (k: string): Record<string, string> => (k.startsWith("sb_") ? { apikey: k } : { apikey: k, Authorization: `Bearer ${k}` });
export default async function handler(_req: any, res: any) {
  const e = process.env;
  const env = Object.fromEntries(
    ["BMONI_BASE_URL", "BMONI_API_KEY", "BMONI_MASTER_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_KEY"].map((k) => [k, Boolean(e[k])])
  );
  const out: Record<string, unknown> = { env, masterKeyLooksValid: /^[0-9a-f]{64}$/i.test(e.BMONI_MASTER_KEY ?? "") };
  try {
    const r = await fetch(`${e.BMONI_BASE_URL}/v1/health`, { headers: { "x-api-key": e.BMONI_API_KEY ?? "" } });
    out.bmoniHealth = { status: r.status, body: (await r.text()).slice(0, 200) };
  } catch (err: any) { out.bmoniHealth = { error: String(err?.message ?? err) }; }
  try {
    const r = await fetch(`${e.SUPABASE_URL}/rest/v1/app_users?select=persona&limit=5`, {
      headers: sbAuth(e.SUPABASE_SERVICE_KEY ?? ""),
    });
    out.supabase = { status: r.status, body: (await r.text()).slice(0, 200) };
  } catch (err: any) { out.supabase = { error: String(err?.message ?? err) }; }
  res.status(200).json(out);
}
