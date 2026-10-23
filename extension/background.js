// Posts batches to the scanner site. Lives here, not in the content script, because MV3
// content scripts cannot make cross-origin requests; host_permissions lets this one.
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.type !== "ingest") return
  chrome.storage.sync.get({ server: "https://wowsearch.viktortimewolf.com", key: "" }, async ({ server, key }) => {
    if (!key) return reply({ ok: false, error: "Set the ingest key in the extension options." })
    try {
      const res = await fetch(`${server}/api/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ingest-key": key },
        body: JSON.stringify({ players: msg.players }),
      })
      reply({ ok: res.ok, status: res.status, body: await res.json().catch(() => null) })
    } catch (e) {
      reply({ ok: false, error: String(e) })
    }
  })
  return true // keep the channel open for the async reply
})
