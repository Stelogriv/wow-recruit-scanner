# WoW Recruit Scanner

One place to find guild recruits: players looking for a guild on WoWProgress, enriched with
Raider.IO (ilvl, M+, raid progress, guild) and Warcraft Logs (overall % at M / H / N / L).

Target: `wowsearch.viktortimewolf.com` on Vercel.

## Status — step 1: prove the sources
`GET /api/probe?key=$PROBE_KEY&region=eu` reads the WoWProgress LFG list and enriches the first
three players. The WoWProgress parser is written against synthetic HTML and is **unverified
against the live page** until this probe runs on Vercel.

## Env
See `.env.example`: `WCL_CLIENT_ID`, `WCL_CLIENT_SECRET`, `PROBE_KEY`.

## Dev
`pnpm install`, `pnpm test`, `pnpm typecheck`, `pnpm dev`.
