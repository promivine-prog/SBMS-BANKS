// DRAFT translations of the main labels only. Needs native-speaker review. Anything not listed stays in English.
export type Lang = "en" | "pcm" | "yo" | "ig" | "ha";
export const LANGS: Record<Lang, string> = { en: "English", pcm: "Pidgin", yo: "Yorùbá", ig: "Igbo", ha: "Hausa" };
const D: Record<string, Partial<Record<Lang, string>>> = {
  Home: { pcm: "Home", yo: "Ilé", ig: "Ụlọ", ha: "Gida" },
  Move: { pcm: "Move money", yo: "Gbé owó", ig: "Bugharịa", ha: "Motsa" },
  Cards: { pcm: "Cards", yo: "Káàdì", ig: "Kaadị", ha: "Katuna" },
  Insights: { pcm: "Wetin dey happen", yo: "Àyẹ̀wò", ig: "Nghọta", ha: "Fahimta" },
  More: { pcm: "More", yo: "Ìyókù", ig: "Ọzọ", ha: "Ƙari" },
  "Add money": { pcm: "Put money", yo: "Fi owó sí", ig: "Tinye ego", ha: "Ƙara kuɗi" },
  Send: { pcm: "Send", yo: "Ránṣẹ́", ig: "Zipu", ha: "Aika" },
  Withdraw: { pcm: "Comot money", yo: "Yọ owó", ig: "Wepụ ego", ha: "Cire kuɗi" },
  "Available balance": { pcm: "Money wey dey", yo: "Owó tó wà", ig: "Ego dị", ha: "Kuɗin da ke akwai" },
  Hide: { pcm: "Hide", yo: "Fi pamọ́", ig: "Zoo", ha: "Ɓoye" },
  Show: { pcm: "Show", yo: "Fihàn", ig: "Gosi", ha: "Nuna" },
  "Recent activity": { pcm: "Wetin don happen", yo: "Àwọn ìgbòkègbodò àìpẹ́", ig: "Ọrụ na-adịbeghị anya", ha: "Ayyukan baya-bayan nan" },
  "My money plan": { pcm: "My money plan", yo: "Ètò owó mi", ig: "Atụmatụ ego m", ha: "Shirin kuɗina" },
  "Daily guide": { pcm: "Daily guide", yo: "Ìtọ́sọ́nà ojoojúmọ́", ig: "Ntuziaka kwa ụbọchị", ha: "Jagorar yau da kullum" },
  "Money coach": { pcm: "Money coach", yo: "Olùkọ́ owó", ig: "Onye nkụzi ego", ha: "Mai horar da kuɗi" },
  Settings: { pcm: "Settings", yo: "Ètò", ig: "Ntọala", ha: "Saituna" },
  Back: { pcm: "Go back", yo: "Padà", ig: "Laghachi", ha: "Koma" },
  Language: { pcm: "Language", yo: "Èdè", ig: "Asụsụ", ha: "Harshe" },
  "Transaction history": { pcm: "Money history", yo: "Ìtàn ìdúnàádúrà", ig: "Akụkọ azụmahịa", ha: "Tarihin mu'amala" },
};
let current: Lang = "en";
try { const s = localStorage.getItem("sbms_lang") as Lang | null; if (s && s in LANGS) current = s; } catch { /* ignore */ }
export const getLang = () => current;
export const setLang = (l: Lang) => { current = l; try { localStorage.setItem("sbms_lang", l); } catch { /* ignore */ } };
export const tr = (s: string) => D[s]?.[current] ?? s;
