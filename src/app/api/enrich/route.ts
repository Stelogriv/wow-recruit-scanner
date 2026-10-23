import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { COOKIE, isValidSession } from "@/lib/auth"
import { enrichPending } from "@/lib/enrich"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** "Refresh scores" button: enrich the next batch. */
export async function POST(req: Request) {
  const jar = await cookies()
  if (!isValidSession(jar.get(COOKIE)?.value, process.env.APP_PASSWORD)) {
    return NextResponse.redirect(new URL("/login", req.url), 303)
  }
  await enrichPending(25)
  return NextResponse.redirect(new URL(req.headers.get("referer") ?? "/", req.url), 303)
}
