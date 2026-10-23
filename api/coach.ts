declare const process: any; // Node global; avoids needing @types/node
// POST { question, balance, txs } -> { answer, provider }.
// Uses GEMINI_API_KEY (free via Google AI Studio) if set, else ANTHROPIC_API_KEY. With neither, the app falls back to rule-based answers.
const SYSTEM = "You are a money coach for Nigerian students. Use only the data given. Reply in 2-4 short sentences, in plain English, with amounts in naira (₦). Give practical steps, not financial product advice. Say so if the data is not enough. If asked about suspicious activity, point to specific transactions and suggest freezing the card if unsure. This is a sandbox with synthetic data.";
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { question, balance, txs } = req.body ?? {};
  const data = JSON.stringify({ balance, txs: Array.isArray(txs) ? txs.slice(0, 40) : [] }).slice(0, 6000);
  const prompt = `Data: ${data}\n\nQuestion: ${String(question ?? "").slice(0, 300)}`;
  const gem = process.env.GEMINI_API_KEY, ant = process.env.ANTHROPIC_API_KEY;
  if (gem) {
    const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "x-goog-api-key": gem, "content-type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 1500 } }),
    });
    if (!r.ok) return res.status(502).json({ error: "Gemini request failed", status: r.status });
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? "").join("").trim();
    return text ? res.status(200).json({ answer: text, provider: "Gemini" }) : res.status(502).json({ error: "Empty reply" });
  }
  if (ant) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": ant, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5", max_tokens: 700, system: SYSTEM, messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) return res.status(502).json({ error: "Claude request failed", status: r.status });
    const j = await r.json();
    return res.status(200).json({ answer: (j.content ?? []).map((c: any) => c.text ?? "").join("").trim(), provider: "Claude" });
  }
  res.status(503).json({ error: "No AI key set" });
}
