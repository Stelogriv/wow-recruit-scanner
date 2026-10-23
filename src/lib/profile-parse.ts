/**
 * Parses the visible TEXT of a WoWProgress character page (sent by the extension).
 * Parsing lives on the server on purpose: when WoWProgress changes its wording, this file is
 * fixed and redeployed — nobody has to reinstall the extension. Written without sight of the
 * live page; every field is optional and a miss means "not found", never a guess.
 */
export type ParsedProfile = {
  battletag: string | null
  discord: string | null
  languages: string[]
  summary: string | null
}

const LETTER = "A-Za-z\\u00C0-\\u024F\\u0400-\\u04FF"
const BATTLETAG = new RegExp(`(?<![\\w#])([${LETTER}][${LETTER}0-9]{1,15}#\\d{4,6})(?!\\d)`)
const DISCORD = /discord(?:\s*(?:id|tag|name))?\s*[:\-–=]?\s*@?([a-z0-9_.]{2,32}(?:#\d{4})?)/i
const LANGUAGES = /languages?\s*:\s*([^\n]+)/i
const SUMMARY_HEAD = /(looking for guild|lfg|comment|about me|info)\s*:?\s*\n?/i

export function parseProfileText(text: string): ParsedProfile {
  const battletag = text.match(BATTLETAG)?.[1] ?? null
  const discordMatch = text.match(DISCORD)?.[1] ?? null
  // "discord: same as battletag" style answers are words, not handles.
  const discord = discordMatch && !/^(same|ask|pm|dm|on|in)$/i.test(discordMatch) ? discordMatch : null
  const languages = (text.match(LANGUAGES)?.[1] ?? "")
    .split(/[,/;|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 30)
  const head = text.search(SUMMARY_HEAD)
  const summary = head >= 0 ? collapse(text.slice(head)).slice(0, 600) || null : null
  return { battletag, discord, languages, summary }
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

/** "8/9 M" → 8, anything else → 0. Used for the "min Mythic bosses" filter. */
export function mythicKills(raidProgress: string | null): number {
  const m = raidProgress?.match(/(\d+)\s*\/\s*\d+\s*M\b/)
  return m ? Number(m[1]) : 0
}
