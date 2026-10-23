import { describe, expect, it } from "vitest"
import { parseLfgList, lfgListUrl } from "../wowprogress"
import { mapRio } from "../raiderio"
import { formatWcl, mapWcl, wclQuery } from "../warcraftlogs"

// Synthetic HTML: the live WoWProgress markup is not verified yet (see /api/probe).
const html = `
<table><tr><td><a href="/character/eu/twisting-nether/Mage%C3%AFa">Mageïa</a></td></tr>
<tr><td><a href="/character/us/area-52/Tanky">Tanky</a></td><td><a href="/character/us/area-52/Tanky">again</a></td></tr>
<tr><td><a href="/guild/eu/draenor/Echo">guild link, not a player</a></td></tr></table>`

describe("WoWProgress LFG parser", () => {
  it("extracts each character once, decoded, and ignores guild links", () => {
    const rows = parseLfgList(html)
    expect(rows.map((r) => `${r.region}/${r.realm}/${r.name}`)).toEqual([
      "eu/twisting-nether/Mageïa",
      "us/area-52/Tanky",
    ])
  })
  it("returns nothing for a block page", () => {
    expect(parseLfgList("<html>Just a moment...</html>")).toEqual([])
  })
  it("builds region-scoped and global list URLs", () => {
    expect(lfgListUrl("eu", 2)).toBe("https://www.wowprogress.com/gearscore/eu/char_rating/lfg.1/sortby.ts/page.2")
    expect(lfgListUrl(null)).toBe("https://www.wowprogress.com/gearscore/char_rating/lfg.1/sortby.ts/page.1")
  })
})

describe("Raider.IO mapping", () => {
  it("takes the newest raid and current M+ score", () => {
    const p = mapRio({
      class: "Mage",
      active_spec_name: "Fire",
      guild: { name: "Echo" },
      gear: { item_level_equipped: 671 },
      mythic_plus_scores_by_season: [{ scores: { all: 3120.5 } }],
      raid_progression: { "old-raid": { summary: "8/8 M" }, "new-raid": { summary: "3/8 M" } },
    })
    expect(p).toEqual({ itemLevel: 671, mplusScore: 3120.5, raidProgress: "3/8 M", guild: "Echo", className: "Mage", spec: "Fire" })
  })
  it("survives a profile with no guild or progress", () => {
    expect(mapRio({}).guild).toBeNull()
  })
})

describe("Warcraft Logs", () => {
  it("asks for all four difficulties with the right ids", () => {
    const q = wclQuery()
    for (const s of ["M: zoneRankings(difficulty: 5)", "H: zoneRankings(difficulty: 4)", "N: zoneRankings(difficulty: 3)", "L: zoneRankings(difficulty: 1)"]) {
      expect(q).toContain(s)
    }
  })
  it("rounds scores and shows a dash where there are none", () => {
    const s = mapWcl({ M: { bestPerformanceAverage: 71.6 }, H: { bestPerformanceAverage: 95.2 }, N: null, L: {} })
    expect(s).toEqual({ M: 72, H: 95, N: null, L: null })
    expect(formatWcl(s!)).toBe("M 72%  H 95%  N –  L –")
  })
  it("returns null for an unknown character", () => {
    expect(mapWcl(null)).toBeNull()
  })
})
