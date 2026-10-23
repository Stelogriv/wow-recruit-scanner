import { NextResponse } from "next/server"
import { fetchText, lfgListUrl, parseLfgList, REGIONS, type Region } from "@/lib/sources/wowprogress"
import { fetchRio } from "@/lib/sources/raiderio"
import { fetchWcl, formatWcl } from "@/lib/sources/warcraftlogs"

export const dynamic = "force-dynamic"

/**
 * Step 1 proof: can Vercel read all three sources? Locked behind PROBE_KEY so it is not a
 * public proxy into those sites. GET /api/probe?key=...&region=eu
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const expected = process.env.PROBE_KEY
  if (!expected || url.searchParams.get("key") !== expected) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  const regionParam = url.searchParams.get("region")
  const region = REGIONS.includes(regionParam as Region) ? (regionParam as Region) : null

  const listUrl = lfgListUrl(region)
  const report: Record<string, unknown> = { listUrl }
  try {
    const t0 = Date.now()
    const page = await fetchText(listUrl)
    const players = parseLfgList(page.body)
    report.wowprogress = {
      status: page.status,
      ms: Date.now() - t0,
      bytes: page.body.length,
      playersFound: players.length,
      first: players.slice(0, 5),
      // Zero rows means either a block page or a layout the parser does not know — show it.
      sample: players.length === 0 ? page.body.slice(0, 1500) : undefined,
    }
    const enriched = []
    for (const p of players.slice(0, 3)) {
      const rio = await fetchRio(p.region, p.realm, p.name).catch((e: Error) => ({ error: e.message }))
      const wcl = await fetchWcl(p.region, p.realm, p.name)
        .then((w) => ({ ...w, display: w.scores ? formatWcl(w.scores) : null }))
        .catch((e: Error) => ({ error: e.message }))
      enriched.push({ player: `${p.name}-${p.realm} (${p.region})`, rio, wcl })
    }
    report.enriched = enriched
  } catch (e) {
    report.error = (e as Error).message
  }
  return NextResponse.json(report)
}
