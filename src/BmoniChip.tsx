import { useEffect, useState } from "react";
export default function BmoniChip() {
  const [s, setS] = useState<"checking" | "up" | "down">("checking");
  useEffect(() => { fetch("/api/status").then((r) => r.json()).then((j) => setS(j.bmoni ? "up" : "down")).catch(() => setS("down")); }, []);
  const label = s === "up" ? "B Moni sandbox: connected" : s === "down" ? "B Moni sandbox: unreachable" : "B Moni: checking…";
  return <span className={"chip" + (s === "up" ? " up" : "")} title="Shows whether B Moni's sandbox API answers. Wallet data in this demo is still simulated.">{label}</span>;
}
