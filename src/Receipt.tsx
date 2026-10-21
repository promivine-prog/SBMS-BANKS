import { useState } from "react";
import { provider, type Tx } from "./provider";
import { naira, refOf, statusLabel, typeLabel } from "./txui";
// Receipts are watermarked: while the wallet is simulated, a receipt must never look like real proof of payment.
const NOTE = "Simulated demo receipt. No money moved. Not proof of payment.";
const when = (t: Tx) => new Date(t.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const rows = (t: Tx): [string, string][] => [
  ["Type", typeLabel(t)], [t.direction === "incoming" ? "From" : "To", t.description.replace(/^(Sent to|Withdrawal to) /, "")],
  ["Category", t.category ?? "Deposit"], ["Date and time", when(t)], ["Reference", refOf(t)], ["Status", statusLabel(t)],
];
async function draw(t: Tx) {
  try { await (document as any).fonts?.ready; } catch { /* ignore */ }
  const W = 800, r = rows(t), H = 420 + r.length * 78 + 170, F = "'Rethink Sans', system-ui, sans-serif";
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#B001B0"; x.fillRect(0, 0, W, 150);
  x.fillStyle = "#FFFFFF"; x.font = `700 56px ${F}`; x.fillText("SBMS", 48, 70);
  x.font = `400 28px ${F}`; x.fillText("Transaction receipt (simulated)", 48, 116);
  const pending = t.status === "pending";
  x.fillStyle = pending ? "#7A4B00" : "#14532D"; x.font = `700 36px ${F}`;
  x.fillText(pending ? "Pending" : t.direction === "incoming" ? "Received" : "Sent successfully", 48, 230);
  x.fillStyle = "#1C0C1C"; x.font = `700 84px ${F}`; x.fillText((t.direction === "incoming" ? "+" : "-") + naira(t.amount), 48, 330);
  let y = 420;
  r.forEach(([k, v]) => {
    x.fillStyle = "#6E5F6E"; x.font = `400 26px ${F}`; x.fillText(k, 48, y);
    x.fillStyle = "#1C0C1C"; x.font = `600 28px ${F}`; x.textAlign = "right";
    let s = v; while (x.measureText(s).width > 480 && s.length > 4) s = s.slice(0, -2);
    x.fillText(s === v ? v : s + "…", W - 48, y); x.textAlign = "left";
    x.strokeStyle = "#EADFEA"; x.beginPath(); x.moveTo(48, y + 26); x.lineTo(W - 48, y + 26); x.stroke(); y += 78;
  });
  x.fillStyle = "#B42318"; x.font = `600 26px ${F}`;
  let line = "", ly = y + 30;
  NOTE.split(" ").forEach((w) => { if (x.measureText(line + w).width > W - 96) { x.fillText(line, 48, ly); line = ""; ly += 36; } line += w + " "; });
  x.fillText(line, 48, ly);
  x.save(); x.translate(W / 2, H / 2); x.rotate(-Math.PI / 7); x.globalAlpha = 0.1; x.fillStyle = "#B001B0"; x.font = `700 150px ${F}`; x.textAlign = "center"; x.fillText("SIMULATED", 0, 0); x.restore();
  return c;
}
export default function Receipt({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const [msg, setMsg] = useState("");
  const pending = tx.status === "pending";
  const makeBlob = async () => { const c = await draw(tx); return new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png")); };
  const download = (b: Blob, name: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
  const name = `sbms-receipt-${refOf(tx)}.png`;
  const share = async () => {
    const b = await makeBlob(), file = new File([b], name, { type: "image/png" }), nav: any = navigator;
    if (nav.canShare?.({ files: [file] })) {
      try { await nav.share({ files: [file], title: "SBMS demo receipt", text: "SBMS simulated demo receipt (no money moved)." }); setMsg("Shared."); return; }
      catch (e: any) { if (e?.name === "AbortError") return; }
    }
    download(b, name); setMsg("Sharing is not available here, so the receipt was downloaded.");
  };
  return (<div className="legal" role="dialog" aria-modal="true" aria-label="Transaction receipt"><div className="legal-box">
    <div className="row"><h2>Receipt</h2><button className="chipbtn" onClick={onClose}>Close</button></div>
    <div className="panel"><span className={"badge " + (pending ? "wait" : "ok")}>{statusLabel(tx)}</span>
      <div className="acct">{tx.direction === "incoming" ? "+" : "-"}{naira(tx.amount)}</div>
      {rows(tx).map(([k, v]) => <div className="row" key={k}><span className="t2">{k}</span><strong>{v}</strong></div>)}
      <p className="muted">{NOTE}</p>{provider.simulated && <span className="sim">Simulated</span>}</div>
    {pending && <p className="muted" role="status">Pending: this changes to Sent in a few seconds.</p>}
    <button className="primary" onClick={share}>Share receipt</button>
    <button className="ghost" onClick={async () => { download(await makeBlob(), name); setMsg("Receipt downloaded."); }}>Download image</button>
    {msg && <p className="muted" role="status">{msg}</p>}</div></div>);
}
