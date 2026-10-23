import { neon } from "@neondatabase/serverless"

let sqlFn: ReturnType<typeof neon> | null = null
let schemaReady: Promise<unknown> | null = null

export function sql() {
  if (!sqlFn) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error("DATABASE_URL is not set (Vercel → Storage → Neon)")
    sqlFn = neon(url)
  }
  return sqlFn
}

/** One table, created on first use, so setup is "connect Neon in Vercel" and nothing else. */
export function ensureSchema() {
  schemaReady ??= sql()`
    CREATE TABLE IF NOT EXISTS players (
      id serial PRIMARY KEY,
      region text NOT NULL,
      realm text NOT NULL,
      name text NOT NULL,
      first_seen timestamptz NOT NULL DEFAULT now(),
      last_seen_lfg timestamptz NOT NULL DEFAULT now(),
      list_row text,
      battletag text,
      discord text,
      languages text[] NOT NULL DEFAULT '{}',
      summary text,
      profile_text text,
      class text,
      spec text,
      item_level real,
      mplus real,
      raid_progress text,
      guild text,
      guild_changes int,
      wcl jsonb,
      enriched_at timestamptz,
      UNIQUE (region, realm, name)
    )`
  return schemaReady
}
