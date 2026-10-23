/**
 * WoWProgress has no API for its "looking for guild" list, so this reads the public page.
 * The parser keys on character links (/character/<region>/<realm>/<name>) rather than table
 * layout, so a redesign of the table does not silently drop every row. UNVERIFIED against the
 * live page — /api/probe exists to check it from Vercel.
 */
export const REGIONS = ["eu", "us", "kr", "tw"] as const
export type Region = (typeof REGIONS)[number]

export type LfgCharacter = { region: Region; realm: string; name: string; profileUrl: string }

const BASE = "https://www.wowprogress.com"

/** The LFG list as the site itself links it: /gearscore/<region>?lfg=1 (confirmed by Viktor). */
export function lfgListUrl(region: Region | null): string {
  const r = region ? `/${region}` : ""
  return `${BASE}/gearscore${r}?lfg=1`
}

const CHAR_LINK = /href="\/character\/(eu|us|kr|tw)\/([^/"]+)\/([^/"?#]+)"/g

export function parseLfgList(html: string): LfgCharacter[] {
  const seen = new Set<string>()
  const out: LfgCharacter[] = []
  for (const m of html.matchAll(CHAR_LINK)) {
    const [, region, realm, name] = m
    const key = `${region}/${realm}/${name}`.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      region: region as Region,
      realm: decodeURIComponent(realm),
      name: decodeURIComponent(name),
      profileUrl: `${BASE}/character/${region}/${realm}/${name}`,
    })
  }
  return out
}

export async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, {
    headers: { "User-Agent": "wowsearch-recruit-scanner (contact: wowsearch.viktortimewolf.com)" },
    cache: "no-store",
  })
  return { status: res.status, body: await res.text() }
}
