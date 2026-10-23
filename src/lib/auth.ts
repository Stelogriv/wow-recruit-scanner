import { createHmac, timingSafeEqual } from "node:crypto"

/** One shared password for Viktor and the GM. The cookie holds an HMAC of it, never the password. */
export const COOKIE = "wowsearch_session"

export function sessionToken(password: string): string {
  return createHmac("sha256", password).update("wowsearch-session-v1").digest("hex")
}

export function isValidSession(cookieValue: string | undefined, password: string | undefined): boolean {
  if (!cookieValue || !password) return false
  const expected = Buffer.from(sessionToken(password))
  const got = Buffer.from(cookieValue)
  return got.length === expected.length && timingSafeEqual(got, expected)
}

export function keyMatches(given: string | null, expected: string | undefined): boolean {
  if (!given || !expected) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
