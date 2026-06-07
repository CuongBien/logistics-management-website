"use client"

import { usePermissions } from "@/components/wms/rbac/usePermissions"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@repo/ui/components/button"

export default function WmsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const { permissions, roles, warehousePermissions, loading, hasWmsAccess } = usePermissions()
  const router = useRouter()
  const pathname = usePathname()
  const { activeWarehouseId } = useWarehouseContext()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
      </div>
    )
  }

  if (!hasWmsAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-5 border border-rose-500/20">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không có quyền truy cập WMS</h1>
        <p className="text-muted-foreground text-xs max-w-sm mt-2 leading-relaxed">
          Tài khoản của bạn là tài khoản khách hàng (Consignor). Bạn không có quyền truy cập vào các phân hệ vận hành và quản lý của WMS.
        </p>
        <div className="mt-6">
          <Button 
            onClick={() => router.push("/orders")}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold text-xs px-5 h-9 rounded-lg"
          >
            Quay lại trang Đơn hàng (OMS)
          </Button>
        </div>
      </div>
    )
  }

  if (!activeWarehouseId && pathname !== "/wms/select") {
    // Show a loader while redirecting to select page
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
      </div>
    )
  }

  return <>{children}</>
}
