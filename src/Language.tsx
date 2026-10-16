import { useState } from "react";
import { LANGS, getLang, setLang, tr, type Lang } from "./i18n";
export default function Language({ onChange }: { onChange: () => void }) {
  const [l, setL] = useState<Lang>(getLang());
  return (<><h2>{tr("Language")}</h2><div className="panel">
    <select className="field" aria-label="Language" value={l} onChange={(e) => { const v = e.target.value as Lang; setLang(v); setL(v); onChange(); }}>
      {(Object.keys(LANGS) as Lang[]).map((k) => <option key={k} value={k}>{LANGS[k]}</option>)}</select>
    <p className="muted">Draft translations of the main labels, awaiting native-speaker review. Other text stays in English for now.</p></div></>);
}
