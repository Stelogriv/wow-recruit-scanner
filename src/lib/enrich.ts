import { sql, ensureSchema } from "./db"
import { fetchRio } from "./sources/raiderio"
import { fetchWcl } from "./sources/warcraftlogs"

/** Fills Raider.IO + Warcraft Logs for players never enriched or stale (>12h), oldest first. */
export async function enrichPending(limit: number): Promise<number> {
  await ensureSchema()
  const rows = (await sql()`
    SELECT id, region, realm, name FROM players
    WHERE enriched_at IS NULL OR enriched_at < now() - interval '12 hours'
    ORDER BY enriched_at NULLS FIRST, last_seen_lfg DESC
    LIMIT ${limit}`) as { id: number; region: string; realm: string; name: string }[]
  for (const r of rows) {
    const rio = await fetchRio(r.region, r.realm, r.name).catch(() => null)
    const wcl = await fetchWcl(r.region, r.realm, r.name).catch(() => null)
    const p = rio?.profile
    await sql()`
      UPDATE players SET
        class = ${p?.className ?? null}, spec = ${p?.spec ?? null},
        item_level = ${p?.itemLevel ?? null}, mplus = ${p?.mplusScore ?? null},
        raid_progress = ${p?.raidProgress ?? null}, guild = ${p?.guild ?? null},
        wcl = ${wcl?.scores ? JSON.stringify(wcl.scores) : null}::jsonb,
        enriched_at = now()
      WHERE id = ${r.id}`
  }
  return rows.length
}
