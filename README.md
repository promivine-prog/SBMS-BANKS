# SBMS – B Moni x TINC26 Hackathon

**Team PROMIVINE:** Divine Iwanger Ande and <your full name>
**Theme:** From Access to Agency
**Live demo:** https://sbms-banks-bovf.vercel.app
Started 15 Oct 2026 for this hackathon. All code in this repository was written during the hackathon window.

## What it does
A banking-style app for Nigerian students living on small, irregular money:
- Money plan with a daily spending guide, expected incomes, and a supportive Survival Mode
- Weekly spending limit that blocks overspending until the user raises it
- Savings goals, spending insights and transaction history
- AI money coach, plus a "check before sending" scam check
- Learn lessons and a hypothetical savings simulator
- Demo signup/login (device-only), optional PIN lock, export and delete my data
- Language picker (draft translations of main labels, awaiting native-speaker review)
- Installable on a phone's home screen

## Live vs simulated
**Live:** hosting, server functions, B Moni sandbox health check, AI coach, Supabase connection (no app data is stored there yet).
**Simulated (labelled "Simulated" in the app):** wallet balance, transactions, deposit account, send, withdraw, card, goals, limit and money plan.
Both shared B Moni test identities were already taken (409), so a simulated provider stands in. The app talks to one provider interface, so a real B Moni provider can be switched in once a team sandbox key is issued.

## AI tools used
- **Claude (Anthropic):** coding assistance, used to plan and write the app and the draft translations.
- **Gemini (Google AI Studio, free tier):** powers the in-app money coach and scam check through a server function. It receives only synthetic data. Anthropic's API is supported as an alternative.
- **Rule-based fallback:** used, and labelled in the app, when no AI key is set.

## Run locally
npm install && npm run dev
Server functions need env variables (see .env.example): BMONI_BASE_URL, BMONI_API_KEY, BMONI_MASTER_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY.

## Sandbox only
No real money, BVNs, accounts or cards. B Moni sandbox and synthetic data only. No keys are stored in this repository.
