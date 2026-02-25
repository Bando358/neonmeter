import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Must match the cookie name in auth.ts
const useSecureCookies = process.env.VERCEL === "1"
const cookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token"

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
    cookieName,
  })
  const isLoggedIn = !!token

  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/companies") ||
    nextUrl.pathname.startsWith("/usage") ||
    nextUrl.pathname.startsWith("/invoices") ||
    nextUrl.pathname.startsWith("/payments") ||
    nextUrl.pathname.startsWith("/settings") ||
    nextUrl.pathname.startsWith("/admin")
  const isWebhookRoute = nextUrl.pathname.startsWith("/api/webhooks")
  const isCronRoute = nextUrl.pathname.startsWith("/api/cron")

  // Allow webhooks and cron routes through (they have their own auth)
  if (isWebhookRoute || isCronRoute) return NextResponse.next()

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // Protect dashboard routes
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Protect admin routes
  if (nextUrl.pathname.startsWith("/admin") && isLoggedIn) {
    if (token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
