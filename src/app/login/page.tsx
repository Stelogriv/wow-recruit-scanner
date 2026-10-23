export default async function Login({ searchParams }: { searchParams: Promise<{ wrong?: string }> }) {
  const { wrong } = await searchParams
  return (
    <main style={{ maxWidth: 360, margin: "15vh auto" }}>
      <h1>WoW Recruit Scanner</h1>
      <form method="post" action="/api/login" style={{ display: "grid", gap: 12 }}>
        <label>
          Password
          <input name="password" type="password" required autoFocus style={{ display: "block", width: "100%", padding: 10, fontSize: 16 }} />
        </label>
        {wrong && <p role="alert" style={{ color: "#c00", margin: 0 }}>Wrong password.</p>}
        <button type="submit" style={{ padding: 12, fontSize: 16 }}>Sign in</button>
      </form>
    </main>
  )
}
