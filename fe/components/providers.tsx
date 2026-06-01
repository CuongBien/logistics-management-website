"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { useEffect } from "react"

function SessionErrorWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: '/login' })
    }
  }, [session])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionErrorWrapper>{children}</SessionErrorWrapper>
    </SessionProvider>
  )
}
