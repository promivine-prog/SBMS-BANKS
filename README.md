# PROMIVINE – B Moni x TINC26 Hackathon

Started 15 Oct 2026 for the "From Access to Agency" hackathon. All code here was written during the hackathon window.

## Run
npm install && npm run dev

## Status
Build 1: banking-style UI shell on a simulated provider (screens labelled "Simulated").
Build 2: server layer. `/api/smoke` checks settings, B Moni and Supabase. `/api/setup-user` creates our sandbox user.
Build 3: AI money coach (Claude via /api/coach, rule-based fallback), simulated send and withdraw.
Build 4: savings goals and an enforced weekly spending limit.
Build 5: runway planner (daily guide from money, essentials and next income date) with a supportive Survival Mode.
Build 6: Learn (5 lessons with quizzes) and a hypothetical savings simulator.
Build 7: optional PIN lock, export my data, delete my data.
Build 9: language picker in Settings (draft translations of main labels, pending native review) and a transaction history screen.
Build 10: "Check before sending" scam check (rule-based floor plus AI).
Next: real B Moni provider once a team sandbox key is issued.

## AI tools used
Claude (Anthropic): coding assistance and, later, the in-app money coach.

## Sandbox only
No real money, BVNs, accounts or cards. B Moni sandbox and synthetic data only.
