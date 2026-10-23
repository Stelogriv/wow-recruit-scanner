/**
 * Warcraft Logs v2 API (client credentials). "Overall" score = bestPerformanceAverage of the
 * current zone at each difficulty, shown as M / H / N / L.
 */
export const DIFFICULTIES = { M: 5, H: 4, N: 3, L: 1 } as const
export type DiffLetter = keyof typeof DIFFICULTIES
export type WclScores = Record<DiffLetter, number | null>

export function wclQuery(): string {
  const parts = (Object.entries(DIFFICULTIES) as [DiffLetter, number][])
    .map(([letter, id]) => `${letter}: zoneRankings(difficulty: ${id})`)
    .join("\n      ")
  return `query($name: String!, $server: String!, $region: String!) {
  characterData {
    character(name: $name, serverSlug: $server, serverRegion: $region) {
      ${parts}
    }
  }
}`
}

type ZoneRankings = { bestPerformanceAverage?: number | null } | null

export function mapWcl(character: Partial<Record<DiffLetter, ZoneRankings>> | null): WclScores | null {
  if (!character) return null
  const pick = (d: DiffLetter) => {
    const v = character[d]?.bestPerformanceAverage
    return typeof v === "number" ? Math.round(v) : null
  }
  return { M: pick("M"), H: pick("H"), N: pick("N"), L: pick("L") }
}

export function formatWcl(s: WclScores): string {
  return (Object.keys(DIFFICULTIES) as DiffLetter[])
    .map((d) => `${d} ${s[d] === null ? "–" : `${s[d]}%`}`)
    .join("  ")
}

let cached: { token: string; expiresAt: number } | null = null

async function token(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token
  const id = process.env.WCL_CLIENT_ID
  const secret = process.env.WCL_CLIENT_SECRET
  if (!id || !secret) throw new Error("WCL_CLIENT_ID / WCL_CLIENT_SECRET are not set")
  const res = await fetch("https://www.warcraftlogs.com/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Warcraft Logs token request failed: ${res.status}`)
  const j = (await res.json()) as { access_token: string; expires_in: number }
  cached = { token: j.access_token, expiresAt: Date.now() + j.expires_in * 1000 }
  return j.access_token
}

export async function fetchWcl(region: string, realm: string, name: string) {
  const res = await fetch("https://www.warcraftlogs.com/api/v2/client", {
    method: "POST",
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: wclQuery(), variables: { name, server: realm, region } }),
    cache: "no-store",
  })
  const j = (await res.json()) as { data?: { characterData?: { character?: Partial<Record<DiffLetter, ZoneRankings>> | null } }; errors?: unknown }
  const character = j.data?.characterData?.character ?? null
  // raw: what WCL actually returned for Mythic, so an all-dash row can be told apart from a wrong zone.
  const raw = character ? JSON.stringify(character.M ?? null).slice(0, 600) : null
  return { status: res.status, found: character !== null, scores: mapWcl(character), errors: j.errors ?? null, raw }
}
