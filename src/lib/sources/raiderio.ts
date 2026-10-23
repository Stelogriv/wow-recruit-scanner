/** Raider.IO public API — character profile enrichment (ilvl, M+ score, raid progress, guild). */
export type RioProfile = {
  itemLevel: number | null
  mplusScore: number | null
  raidProgress: string | null
  guild: string | null
  className: string | null
  spec: string | null
}

type RioResponse = {
  class?: string
  active_spec_name?: string
  guild?: { name?: string } | null
  gear?: { item_level_equipped?: number }
  mythic_plus_scores_by_season?: { scores?: { all?: number } }[]
  raid_progression?: Record<string, { summary?: string }>
}

export function rioProfileUrl(region: string, realm: string, name: string): string {
  const q = new URLSearchParams({
    region,
    realm,
    name,
    fields: "gear,guild,raid_progression,mythic_plus_scores_by_season:current",
  })
  return `https://raider.io/api/v1/characters/profile?${q}`
}

export function mapRio(r: RioResponse): RioProfile {
  const raids = Object.values(r.raid_progression ?? {})
  return {
    itemLevel: r.gear?.item_level_equipped ?? null,
    mplusScore: r.mythic_plus_scores_by_season?.[0]?.scores?.all ?? null,
    // Raider.IO lists raids newest-last; the newest tier is the one a recruiter cares about.
    raidProgress: raids.at(-1)?.summary ?? null,
    guild: r.guild?.name ?? null,
    className: r.class ?? null,
    spec: r.active_spec_name ?? null,
  }
}

export async function fetchRio(region: string, realm: string, name: string) {
  const res = await fetch(rioProfileUrl(region, realm, name), { cache: "no-store" })
  if (!res.ok) return { status: res.status, profile: null }
  return { status: res.status, profile: mapRio((await res.json()) as RioResponse) }
}
