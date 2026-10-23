import { NextResponse } from "next/server"
import { COOKIE, keyMatches, sessionToken } from "@/lib/auth"

export async function POST(req: Request) {
  const form = await req.formData()
  const password = process.env.APP_PASSWORD
  const given = String(form.get("password") ?? "")
  if (!keyMatches(given, password)) {
    return NextResponse.redirect(new URL("/login?wrong=1", req.url), 303)
  }
  const res = NextResponse.redirect(new URL("/", req.url), 303)
  res.cookies.set(COOKIE, sessionToken(password!), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
