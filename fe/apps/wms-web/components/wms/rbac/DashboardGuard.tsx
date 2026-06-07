"use client"

import { useEffect, useState } from "react"
import { usePermissions } from "@/components/wms/rbac/usePermissions"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
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
      if (!activeWarehouseId && pathname !== "/select-warehouse" && pathname !== "/warehouse") {
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

  // 1. Block OMS customers / users without WMS access
  if (status === "authenticated" && !hasWmsAccess) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#1E2227] text-white px-6">
        <div className="max-w-md w-full bg-[#21252B] rounded-2xl p-8 border border-[#3E4451] shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center border-2 border-red-500/20">
              <span className="text-3xl">🚫</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-red-500 uppercase tracking-wide">Truy Cập Bị Từ Chối</h2>
          <p className="text-sm text-[#ABB2BF] leading-relaxed">
            Tài khoản <strong className="text-white">{session?.user?.name || 'khách'}</strong> không có quyền truy cập vào <strong>Hệ thống Quản lý Kho (WMS)</strong>.
            <br/>
            Đây là phân hệ nội bộ dành riêng cho Nhân viên/Thủ kho.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <a 
              href="http://localhost:3001" 
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 text-center"
            >
              Đi tới Cổng Khách Hàng (OMS)
            </a>
            <button 
              onClick={() => {
                import('next-auth/react').then(m => m.signOut({ callbackUrl: '/login' }));
              }}
              className="w-full py-3 px-4 rounded-xl border border-[#3E4451] hover:bg-muted/10 text-sm font-semibold transition-colors"
            >
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Prevent flashing dashboard UI while redirecting
  if (hasWmsAccess && !activeWarehouseId && pathname !== "/select-warehouse" && pathname !== "/warehouse") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-[#C41E3A]" />
      </div>
    )
  }

  return <>{children}</>
}
