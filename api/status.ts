declare const process: any;
// Public, minimal: only says whether B Moni's sandbox health check answers. Never returns keys or settings.
export default async function handler(_req: any, res: any) {
  try {
    const r = await fetch(`${process.env.BMONI_BASE_URL}/v1/health`, { headers: { "x-api-key": process.env.BMONI_API_KEY ?? "" } });
    res.status(200).json({ bmoni: r.ok });
  } catch { res.status(200).json({ bmoni: false }); }
}
