// Runs on WoWProgress gearscore pages. Only acts on the "looking for guild" list (?lfg=1).
(() => {
  if (!new URLSearchParams(location.search).has("lfg")) return

  const SEEN_KEY = "seen" // name -> timestamp; skip profile fetches done in the last 12h
  const TWELVE_H = 12 * 3600 * 1000
  const DELAY_MS = 1500 // one profile page every 1.5s: a person clicking, not a crawler
  const MAX_PER_PAGE = 60

  const badge = document.createElement("div")
  badge.style.cssText =
    "position:fixed;bottom:12px;right:12px;z-index:99999;background:#111;color:#fff;padding:10px 14px;border-radius:8px;font:14px system-ui;max-width:320px;box-shadow:0 2px 8px #0006"
  document.body.appendChild(badge)
  const say = (t) => (badge.textContent = `Recruit Scanner: ${t}`)

  const players = []
  const seenKeys = new Set()
  for (const a of document.querySelectorAll('a[href*="/character/"]')) {
    const m = new URL(a.href, location.href).pathname.match(/^\/character\/(eu|us|kr|tw)\/([^/]+)\/([^/]+)\/?$/)
    if (!m) continue
    const key = `${m[1]}/${m[2]}/${m[3]}`.toLowerCase()
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    const row = a.closest("tr")
    players.push({
      region: m[1],
      realm: decodeURIComponent(m[2]),
      name: decodeURIComponent(m[3]),
      href: a.href,
      listRow: row ? row.innerText.replace(/\s+/g, " ").trim().slice(0, 500) : undefined,
    })
  }
  if (!players.length) return say("no players found on this page.")

  const send = (batch) =>
    new Promise((resolve) => chrome.runtime.sendMessage({ type: "ingest", players: batch }, resolve))
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  ;(async () => {
    const { [SEEN_KEY]: seen = {} } = await chrome.storage.local.get(SEEN_KEY)
    const now = Date.now()
    // 1) The list itself: cheap, send everything at once.
    const first = await send(players.map(({ href, ...p }) => p))
    if (!first?.ok) return say(`could not reach your site (${first?.status ?? first?.error}).`)

    // 2) Profile pages for BattleTag / Discord / languages / what they want.
    const todo = players.filter((p) => !(seen[p.href] > now - TWELVE_H)).slice(0, MAX_PER_PAGE)
    let done = 0
    for (const p of todo) {
      say(`reading profiles ${done + 1}/${todo.length}…`)
      const res = await fetch(p.href, { credentials: "include" })
      if (!res.ok) return say(`WoWProgress answered ${res.status}; stopped. Try again later.`)
      const doc = new DOMParser().parseFromString(await res.text(), "text/html")
      const main = doc.querySelector("#content, .primary, main") ?? doc.body
      const { href, ...rest } = p
      await send([{ ...rest, profileText: main.innerText.slice(0, 20000) }])
      seen[p.href] = Date.now()
      await chrome.storage.local.set({ [SEEN_KEY]: seen })
      done++
      await sleep(DELAY_MS)
    }
    say(`sent ${players.length} players (${done} profiles read). Open wowsearch to view.`)
  })()
})()
