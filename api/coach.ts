// POST { question, balance, txs } -> { answer }. Needs ANTHROPIC_API_KEY; without it the app falls back to rule-based answers.
const SYSTEM = "You are a money coach for Nigerian students. Use only the data given. Reply in 2-4 short sentences, in plain English, with amounts in naira (₦). Give practical steps, not financial product advice. Say so if the data is not enough. If asked about suspicious activity, point to specific transactions and suggest freezing the card if unsure. This is a sandbox with synthetic data.";
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "AI key not set" });
  const { question, balance, txs } = req.body ?? {};
  const data = JSON.stringify({ balance, txs: Array.isArray(txs) ? txs.slice(0, 40) : [] }).slice(0, 6000);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5", max_tokens: 400, system: SYSTEM,
      messages: [{ role: "user", content: `Data: ${data}\n\nQuestion: ${String(question ?? "").slice(0, 300)}` }] }),
  });
  if (!r.ok) return res.status(502).json({ error: "AI request failed", status: r.status });
  const j = await r.json();
  res.status(200).json({ answer: (j.content ?? []).map((c: any) => c.text ?? "").join("").trim() });
}
