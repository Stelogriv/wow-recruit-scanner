import { guildChangeColor, type ChangeColor } from "./guild-changes"
import { mythicKills } from "./profile-parse"
import type { WclScores } from "./sources/warcraftlogs"
import { specKey } from "./specs"

export const DURATIONS = { "3d": 3, "7d": 7, "14d": 14 } as const
export type Duration = keyof typeof DURATIONS

export type Filters = {
  region: string | null
  language: string | null
  duration: Duration
  specs: string[]
  minIlvl: number
  minMplus: number
  minMythic: number
}

export type PlayerRow = {
  region: string
  realm: string
  name: string
  last_seen_lfg: string | Date
  battletag: string | null
  discord: string | null
  languages: string[]
  summary: string | null
  class: string | null
  spec: string | null
  item_level: number | null
  mplus: number | null
  raid_progress: string | null
  guild: string | null
  guild_changes: number | null
  wcl: WclScores | null
}

type Params = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null
const num = (v: string | string[] | undefined) => {
  const n = Number(one(v))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function parseFilters(p: Params): Filters {
  const d = one(p.duration)
  const specs = p.spec === undefined ? [] : Array.isArray(p.spec) ? p.spec : [p.spec]
  return {
    region: one(p.region) || null,
    language: one(p.language) || null,
    duration: d && d in DURATIONS ? (d as Duration) : "7d",
    specs,
    minIlvl: num(p.minIlvl),
    minMplus: num(p.minMplus),
    minMythic: num(p.minMythic),
  }
}

export function matches(row: PlayerRow, f: Filters, now = Date.now()): boolean {
  const ageDays = (now - new Date(row.last_seen_lfg).getTime()) / 86_400_000
  if (ageDays > DURATIONS[f.duration]) return false
  if (f.region && row.region !== f.region) return false
  if (f.language && !row.languages.some((l) => l.toLowerCase() === f.language!.toLowerCase())) return false
  // Not enriched yet → class/spec unknown → keep it visible rather than hide a possible recruit.
  if (f.specs.length && row.class && row.spec && !f.specs.includes(specKey(row.class, row.spec))) return false
  if (f.minIlvl && (row.item_level ?? 0) < f.minIlvl) return false
  if (f.minMplus && (row.mplus ?? 0) < f.minMplus) return false
  if (f.minMythic && mythicKills(row.raid_progress) < f.minMythic) return false
  return true
}

export function changeColor(row: PlayerRow): ChangeColor | null {
  return row.guild_changes === null ? null : guildChangeColor(row.guild_changes)
}
