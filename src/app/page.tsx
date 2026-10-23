import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { COOKIE, isValidSession } from "@/lib/auth"
import { ensureSchema, sql } from "@/lib/db"
import { changeColor, DURATIONS, matches, parseFilters, type PlayerRow } from "@/lib/search"
import { CLASS_SPECS, specKey } from "@/lib/specs"
import { formatWcl } from "@/lib/sources/warcraftlogs"

export const dynamic = "force-dynamic"

const COLORS = { green: "#1a7f37", yellow: "#b08800", red: "#cf222e" } as const

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const jar = await cookies()
  if (!isValidSession(jar.get(COOKIE)?.value, process.env.APP_PASSWORD)) redirect("/login")

  const params = await searchParams
  const f = parseFilters(params)
  await ensureSchema()
  const rows = (await sql()`
    SELECT region, realm, name, last_seen_lfg, battletag, discord, languages, summary, class, spec,
           item_level, mplus, raid_progress, guild, guild_changes, wcl
    FROM players WHERE last_seen_lfg > now() - interval '14 days'
    ORDER BY last_seen_lfg DESC LIMIT 2000`) as PlayerRow[]
  const languages = [...new Set(rows.flatMap((r) => r.languages))].sort()
  const shown = rows.filter((r) => matches(r, f))
  const pending = rows.filter((r) => r.class === null).length

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>WoW Recruit Scanner</h1>
      <form method="get" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <label>Region{" "}
            <select name="region" defaultValue={f.region ?? ""}>
              <option value="">All</option>
              {["eu", "us", "kr", "tw"].map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </label>
          <label>Language{" "}
            <select name="language" defaultValue={f.language ?? ""}>
              <option value="">Any</option>
              {languages.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ float: "left", marginRight: 6 }}>Posted within</legend>
            {Object.keys(DURATIONS).map((d) => (
              <label key={d} style={{ marginRight: 8 }}>
                <input type="radio" name="duration" value={d} defaultChecked={f.duration === d} /> {d}
              </label>
            ))}
          </fieldset>
          <label>Min ilvl <input name="minIlvl" type="number" inputMode="numeric" defaultValue={f.minIlvl || ""} style={{ width: 70 }} /></label>
          <label>Min M+ <input name="minMplus" type="number" inputMode="numeric" defaultValue={f.minMplus || ""} style={{ width: 70 }} /></label>
          <label>Min Mythic bosses <input name="minMythic" type="number" inputMode="numeric" defaultValue={f.minMythic || ""} style={{ width: 50 }} /></label>
        </div>
        <details open={f.specs.length > 0}>
          <summary>Specs I need {f.specs.length > 0 && `(${f.specs.length})`}</summary>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
            {Object.entries(CLASS_SPECS).map(([cls, specs]) => (
              <fieldset key={cls} style={{ margin: 0 }}>
                <legend>{cls}</legend>
                {specs.map((s) => (
                  <label key={s} style={{ display: "block" }}>
                    <input type="checkbox" name="spec" value={specKey(cls, s)} defaultChecked={f.specs.includes(specKey(cls, s))} /> {s}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        </details>
        <div><button type="submit" style={{ padding: "10px 20px", fontSize: 16 }}>Search</button></div>
      </form>

      <p>
        {shown.length} of {rows.length} players.{" "}
        {pending > 0 && <>{pending} still waiting for Raider.IO / Warcraft Logs data. </>}
      </p>
      <form method="post" action="/api/enrich"><button type="submit">Refresh scores</button></form>

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ccc" }}>
              <th>Player</th><th>Contact</th><th>Spec / ilvl / M+</th><th>Raid</th>
              <th>Guild changes</th><th>Warcraft Logs</th><th>What they want</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const color = changeColor(r)
              return (
                <tr key={`${r.region}/${r.realm}/${r.name}`} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
                  <td>
                    <a href={`https://www.wowprogress.com/character/${r.region}/${r.realm}/${encodeURIComponent(r.name)}`} target="_blank" rel="noreferrer">{r.name}</a>
                    <div style={{ color: "#666" }}>{r.realm} ({r.region.toUpperCase()})</div>
                    {r.guild && <div style={{ color: "#666" }}>&lt;{r.guild}&gt;</div>}
                  </td>
                  <td>
                    {r.battletag && <div>BT: {r.battletag}</div>}
                    {r.discord && <div>Discord: {r.discord}</div>}
                    {!r.battletag && !r.discord && <span style={{ color: "#999" }}>—</span>}
                  </td>
                  <td>{r.spec ?? "?"} {r.class ?? ""}<div>{r.item_level ? Math.round(r.item_level) : "?"} ilvl · {r.mplus ? Math.round(r.mplus) : 0} M+</div></td>
                  <td>{r.raid_progress ?? "?"}</td>
                  <td>{color ? <span style={{ color: COLORS[color], fontWeight: 700 }}>● {r.guild_changes}</span> : <span style={{ color: "#999" }}>?</span>}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {r.wcl ? formatWcl(r.wcl) : "—"}{" "}
                    <a href={`https://www.warcraftlogs.com/character/${r.region}/${r.realm}/${encodeURIComponent(r.name)}`} target="_blank" rel="noreferrer">logs</a>
                  </td>
                  <td style={{ maxWidth: 360 }}>{r.summary ?? <span style={{ color: "#999" }}>—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p style={{ color: "#666", fontSize: 12, marginTop: 24 }}>
        Player data from <a href="https://www.wowprogress.com/">WoWProgress.com</a>,{" "}
        <a href="https://raider.io/">Raider.IO</a> and <a href="https://www.warcraftlogs.com/">Warcraft Logs</a>.
      </p>
    </main>
  )
}
