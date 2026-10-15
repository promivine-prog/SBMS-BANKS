# PROMIVINE – B Moni x TINC26 Hackathon

Started 15 Oct 2026 for the "From Access to Agency" hackathon. All code here was written during the hackathon window.

## Run
npm install && npm run dev

## Status
Build 1: banking-style UI shell on a simulated provider (screens labelled "Simulated").
Build 2: server layer. `/api/smoke` checks settings, B Moni and Supabase. `/api/setup-user` creates our sandbox user.
Build 3: AI money coach (Claude via /api/coach, rule-based fallback), simulated send and withdraw.
Next: real B Moni provider once a team sandbox key is issued.

## AI tools used
Claude (Anthropic): coding assistance and, later, the in-app money coach.

## Sandbox only
No real money, BVNs, accounts or cards. B Moni sandbox and synthetic data only.
