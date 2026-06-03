import { withAuth } from "next-auth/middleware"

// Protect all internal routes, redirect to /login if not authenticated
export default withAuth({
  secret: process.env.NEXTAUTH_SECRET || "a-very-secure-random-secret-for-development",
  pages: {
    signIn: "/login",
  },
})

// Configure the paths that should be protected
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
    "/portal/dashboard/:path*",
    "/portal/orders/:path*",
    "/portal/tracking/:path*"
  ]
}
