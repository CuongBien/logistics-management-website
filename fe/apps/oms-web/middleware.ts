import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Check if it's a Portal (OMS) route
  if (pathname.startsWith('/')) {
    // Auth pages (login, register) are public
    const isPortalAuthPage = pathname === '/login' || pathname === '/register'
    if (isPortalAuthPage) {
      return NextResponse.next()
    }

    const isPortalProtectedRoute =
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/tracking') ||
      pathname.startsWith('/inbound-requests') ||
      pathname.startsWith('/contacts') ||
      pathname.startsWith('/reconciliation') ||
      pathname.startsWith('/profile')

    if (isPortalProtectedRoute) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET || "a-very-secure-random-secret-for-development",
        cookieName: process.env.NODE_ENV === "production" ? "__Secure-oms-session-token" : "oms-session-token",
      })

      if (!token) {
        const loginUrl = new URL('/login', req.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
    return NextResponse.next()
  }

  // 2. WMS internal routes
  const isWmsAuthPage = pathname === '/login'
  if (isWmsAuthPage) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "a-very-secure-random-secret-for-development",
    cookieName: process.env.NODE_ENV === "production" ? "__Secure-wms-session-token" : "wms-session-token",
  })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Match exact routes as defined in old middleware to keep WMS and Portal protected properly
export const config = {
  matcher: [
    "/",
    "/inbound/:path*",
    "/outbound/:path*",
    "/inventory/:path*",
    "/crossdock/:path*",
    "/masterdata/:path*",
    "/orders/:path*",
    "/settings/:path*",
    "/tasks/:path*",
    "/warehouse/:path*",
    "/wms/:path*",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/orders/:path*",
    "/tracking/:path*",
    "/inbound-requests/:path*",
    "/contacts/:path*",
    "/reconciliation/:path*",
    "/profile/:path*",
  ]
}
