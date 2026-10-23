# WoW Recruit Scanner

One place to find guild recruits: players looking for a guild on WoWProgress, enriched with
Raider.IO (spec, ilvl, M+, raid progress, guild) and Warcraft Logs (overall % at M / H / N / L).

Live: `wowsearch.viktortimewolf.com` (Vercel). Data from WoWProgress.com, Raider.IO and Warcraft Logs.

## Why a browser extension
WoWProgress sits behind Cloudflare, which blocks Vercel's servers (403 "you have been blocked",
proved with `/api/probe`). Raider.IO and Warcraft Logs work from Vercel. So the extension in
`extension/` reads the LFG list in your own logged-in browser and sends the players to the site;
the site does the rest.

- Open `https://www.wowprogress.com/gearscore/eu?lfg=1&sortby=ts`. The extension sends the list,
  then reads each player's profile (one every 1.5 s, max 60 per page, skips any read in the last
  12 h) for BattleTag / Discord / languages / what they want.
- Profile text is parsed on the server (`src/lib/profile-parse.ts`), so wording fixes need a
  redeploy, not an extension reinstall.

## Not built yet
- Guild changes in the past year (column shows `?`) — source not confirmed.
- Email reports (Resend + Vercel cron).

## Env
See `.env.example`.

## Dev
`pnpm install`, `pnpm test`, `pnpm typecheck`, `pnpm dev`.
