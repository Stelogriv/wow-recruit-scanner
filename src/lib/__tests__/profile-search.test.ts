import { describe, expect, it } from "vitest"
import { mythicKills, parseProfileText } from "../profile-parse"
import { matches, parseFilters, type PlayerRow } from "../search"
import { isValidSession, keyMatches, sessionToken } from "../auth"

describe("parseProfileText", () => {
  it("finds battletag, discord, languages and the LFG summary", () => {
    const p = parseProfileText(
      "Promaxx\nLanguages: English, Русский\nBattletag: Промакс#2201\nLooking for guild:\nMythic raiding 2 nights,\nDiscord: promax_tank",
    )
    expect(p.battletag).toBe("Промакс#2201")
    expect(p.discord).toBe("promax_tank")
    expect(p.languages).toEqual(["English", "Русский"])
    expect(p.summary).toMatch(/^Looking for guild: Mythic raiding 2 nights/)
  })
  it("returns nulls instead of guessing", () => {
    expect(parseProfileText("nothing useful here")).toEqual({ battletag: null, discord: null, languages: [], summary: null })
  })
  it("ignores 'discord: same' style answers", () => {
    expect(parseProfileText("Discord: same as bnet").discord).toBeNull()
  })
  it("does not take a guild rank like #12 or a long number as a battletag", () => {
    expect(parseProfileText("World rank #1234 and id 99999999").battletag).toBeNull()
    expect(parseProfileText("ref Abc#12345678").battletag).toBeNull()
  })
})

describe("mythicKills", () => {
  it.each([["8/9 M", 8], ["9/9 H", 0], [null, 0], ["0/9 M", 0]] as const)("%s → %i", (s, n) => {
    expect(mythicKills(s)).toBe(n)
  })
})

const base: PlayerRow = {
  region: "eu", realm: "gordunni", name: "X", last_seen_lfg: new Date("2026-10-20T00:00:00Z"),
  battletag: null, discord: null, languages: ["English"], summary: null,
  class: "Warrior", spec: "Protection", item_level: 670, mplus: 3000, raid_progress: "5/9 M",
  guild: null, guild_changes: null, wcl: null,
}
const now = new Date("2026-10-23T00:00:00Z").getTime()

describe("search filters", () => {
  it("defaults to 7 days and keeps a 3-day-old post", () => {
    expect(matches(base, parseFilters({}), now)).toBe(true)
  })
  it("drops a post older than the chosen duration", () => {
    expect(matches(base, parseFilters({ duration: "3d" }), now)).toBe(true)
    expect(matches({ ...base, last_seen_lfg: new Date("2026-10-15T00:00:00Z") }, parseFilters({ duration: "7d" }), now)).toBe(false)
  })
  it("filters by spec using Class:Spec so Frost Mage is not Frost DK", () => {
    const f = parseFilters({ spec: ["Death Knight:Frost"] })
    expect(matches({ ...base, class: "Mage", spec: "Frost" }, f, now)).toBe(false)
    expect(matches({ ...base, class: "Death Knight", spec: "Frost" }, f, now)).toBe(true)
  })
  it("keeps not-yet-enriched players visible under a spec filter", () => {
    expect(matches({ ...base, class: null, spec: null }, parseFilters({ spec: "Mage:Fire" }), now)).toBe(true)
  })
  it("applies ilvl, M+, mythic bosses, region and language minimums", () => {
    expect(matches(base, parseFilters({ minIlvl: "680" }), now)).toBe(false)
    expect(matches(base, parseFilters({ minMplus: "3001" }), now)).toBe(false)
    expect(matches(base, parseFilters({ minMythic: "6" }), now)).toBe(false)
    expect(matches(base, parseFilters({ region: "us" }), now)).toBe(false)
    expect(matches(base, parseFilters({ language: "german" }), now)).toBe(false)
    expect(matches(base, parseFilters({ language: "english", minMythic: "5" }), now)).toBe(true)
  })
})

describe("auth", () => {
  it("accepts only the session made from the current password", () => {
    expect(isValidSession(sessionToken("pw1"), "pw1")).toBe(true)
    expect(isValidSession(sessionToken("pw1"), "pw2")).toBe(false)
    expect(isValidSession(undefined, "pw1")).toBe(false)
    expect(isValidSession(sessionToken("pw1"), undefined)).toBe(false)
  })
  it("refuses a missing key even when the env var is missing too", () => {
    expect(keyMatches(null, undefined)).toBe(false)
    expect(keyMatches("", "")).toBe(false)
    expect(keyMatches("a", "a")).toBe(true)
  })
})
