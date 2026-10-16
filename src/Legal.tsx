import { useState } from "react";
export type DocKey = "terms" | "privacy";
// Plain-language drafts for a hackathon prototype. Not lawyer-reviewed: needs legal review before any real launch.
const DOCS: Record<DocKey, { title: string; sections: [string, string][] }> = {
  terms: { title: "Terms and Agreement", sections: [
    ["1. About SBMS", "SBMS is a prototype built by team PROMIVINE for the B Moni x TINC26 hackathon. It is a demonstration. It is not a bank and not a licensed financial service."],
    ["2. No real money", "SBMS does not hold, move or transfer real money. Balances, transactions, cards and account numbers shown are simulated test data. Do not enter real card numbers, BVN, NIN or passwords you use elsewhere."],
    ["3. Not financial advice", "Money plans, daily guides, coach answers, scam checks and simulator results are estimates for learning. They are hypothetical, not promises or advice. AI answers can be wrong. Check important decisions with your bank or a qualified adviser."],
    ["4. Your account", "Your demo account is saved only on your own device. You are responsible for your password and PIN. If you forget them, we cannot recover them, and clearing this site's data in your browser removes the account."],
    ["5. Acceptable use", "Use SBMS lawfully. Do not try to disrupt it, probe its servers, or misuse the AI features."],
    ["6. Availability and risk", "The prototype may change, break or be taken down at any time without notice. It is provided as is, without warranties. To the extent the law allows, the team is not liable for losses from using it."],
    ["7. Changes and contact", "We may update these terms and will show the version date. Contact the team through the project's GitHub repository: github.com/promivine-prog/SBMS-BANKS."],
  ] },
  privacy: { title: "Privacy Policy", sections: [
    ["1. What stays on your device", "Your demo account (name, email and a hashed password), your PIN hash, your language choice and some display preferences are stored in your browser. We do not receive your email or password. The simulated wallet data lives in memory and is lost when you reload."],
    ["2. What leaves your device", "When you use the money coach or the check-before-sending feature, your question and a summary of the simulated data (balance, transaction descriptions, amounts, categories and dates) are sent to our server, which forwards them to an AI provider (Google Gemini, or Anthropic if configured) to produce an answer. Do not type personal or sensitive information into the coach. Google's free-tier terms may allow it to use inputs to improve its products. We also run a status check against B Moni's sandbox that carries no user data."],
    ["3. What we do not do", "We use no advertising, no analytics and no tracking cookies. Our database connection currently stores no user data."],
    ["4. Your choices", "In Settings you can export your data, delete it, remove your PIN or log out. Clearing this site's data in your browser removes everything stored on your device."],
    ["5. Age", "If you are under 18, use SBMS together with a parent or guardian."],
    ["6. Security", "We use HTTPS and keep service keys on the server, but no system is perfectly secure and this is a prototype. Do not rely on it for sensitive information."],
    ["7. Changes and legal note", "We may update this policy and will show the version date. If SBMS became a real service, it would need a full legal review and compliance with Nigeria's data protection law."],
  ] },
};
export default function Legal({ doc, onClose }: { doc: DocKey; onClose: () => void }) {
  const d = DOCS[doc];
  return (<div className="legal" role="dialog" aria-modal="true" aria-label={d.title}><div className="legal-box">
    <div className="row"><h2>{d.title}</h2><button className="chipbtn" onClick={onClose}>Close</button></div>
    <p className="muted">Version 1 · 16 October 2026</p>
    {d.sections.map(([h, t]) => <section key={h}><h3 className="day">{h}</h3><p>{t}</p></section>)}
    <button className="primary" onClick={onClose}>Close</button></div></div>);
}
export function LegalLinks() {
  const [doc, setDoc] = useState<DocKey | null>(null);
  return (<><h2>Legal</h2><div className="panel">
    <button className="ghost" onClick={() => setDoc("terms")}>Terms and Agreement</button>
    <button className="ghost" onClick={() => setDoc("privacy")}>Privacy Policy</button></div>
    {doc && <Legal doc={doc} onClose={() => setDoc(null)} />}</>);
}
