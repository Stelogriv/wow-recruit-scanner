const $ = (id) => document.getElementById(id)
chrome.storage.sync.get({ server: "https://wowsearch.viktortimewolf.com", key: "" }, (v) => {
  $("server").value = v.server
  $("key").value = v.key
})
$("save").onclick = () =>
  chrome.storage.sync.set({ server: $("server").value.replace(/\/$/, ""), key: $("key").value.trim() }, () => {
    $("msg").textContent = "Saved."
  })
