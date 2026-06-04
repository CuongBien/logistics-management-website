"use client"

import { useEffect, useState } from "react"
import { usePermissions } from "@/components/wms/rbac/usePermissions"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { hasWmsAccess, loading } = usePermissions()
  const { activeWarehouseId } = useWarehouseContext()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === "authenticated" && !loading && hasWmsAccess) {
      if (!activeWarehouseId && pathname !== "/select-warehouse") {
        router.replace("/select-warehouse")
      }
    }
  }, [status, loading, hasWmsAccess, activeWarehouseId, pathname, router])

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-[#C41E3A]" />
      </div>
    )
  }

  // Prevent flashing dashboard UI while redirecting
  if (hasWmsAccess && !activeWarehouseId && pathname !== "/select-warehouse") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-[#C41E3A]" />
      </div>
    )
  }

  return <>{children}</>
}
