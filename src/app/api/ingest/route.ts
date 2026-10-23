import { NextResponse } from "next/server"
import { z } from "zod"
import { ensureSchema, sql } from "@/lib/db"
import { keyMatches } from "@/lib/auth"
import { parseProfileText } from "@/lib/profile-parse"
import { enrichPending } from "@/lib/enrich"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const Player = z.object({
  region: z.enum(["eu", "us", "kr", "tw"]),
  realm: z.string().min(1).max(64),
  name: z.string().min(1).max(32),
  listRow: z.string().max(500).optional(),
  profileText: z.string().max(20000).optional(),
})
const Body = z.object({ players: z.array(Player).max(100) })

/** Called by the browser extension with players it saw on WoWProgress. Header: x-ingest-key. */
export async function POST(req: Request) {
  if (!keyMatches(req.headers.get("x-ingest-key"), process.env.INGEST_KEY)) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "bad body" }, { status: 400 })

  await ensureSchema()
  for (const p of parsed.data.players) {
    const prof = p.profileText ? parseProfileText(p.profileText) : null
    await sql()`
      INSERT INTO players (region, realm, name, list_row, profile_text, battletag, discord, languages, summary)
      VALUES (${p.region}, ${p.realm}, ${p.name}, ${p.listRow ?? null}, ${p.profileText ?? null},
              ${prof?.battletag ?? null}, ${prof?.discord ?? null}, ${prof?.languages ?? []}, ${prof?.summary ?? null})
      ON CONFLICT (region, realm, name) DO UPDATE SET
        last_seen_lfg = now(),
        list_row = COALESCE(EXCLUDED.list_row, players.list_row),
        profile_text = COALESCE(EXCLUDED.profile_text, players.profile_text),
        battletag = COALESCE(EXCLUDED.battletag, players.battletag),
        discord = COALESCE(EXCLUDED.discord, players.discord),
        languages = CASE WHEN cardinality(EXCLUDED.languages) > 0 THEN EXCLUDED.languages ELSE players.languages END,
        summary = COALESCE(EXCLUDED.summary, players.summary)`
  }
  // Small batch: the extension calls this once per profile, so enrichment keeps pace without long requests.
  const enriched = await enrichPending(3)
  return NextResponse.json({ stored: parsed.data.players.length, enriched })
}
