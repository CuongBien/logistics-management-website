"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"

function SessionErrorWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      if (pathname && pathname.startsWith('/')) {
        signOut({ callbackUrl: '/login' })
      } else {
        signOut({ callbackUrl: '/login' })
      }
    }
  }, [session, pathname])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionErrorWrapper>
        {children}
      </SessionErrorWrapper>
    </SessionProvider>
  )
}
