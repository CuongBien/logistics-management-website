"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { WarehouseHierarchyDto } from "@/types/wms-layout"
import { getWarehouseHierarchy } from "@/lib/api/wms-layout"
import { HierarchyTree } from "@/components/wms/layout/HierarchyTree"
import { Loader2, ArrowLeft, ShieldAlert } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { usePermissions } from "@/components/wms/rbac/usePermissions"
import { useSession } from "next-auth/react"

export default function WarehouseLayoutPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [hierarchy, setHierarchy] = useState<WarehouseHierarchyDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { roles, hasPermissionInAnyWarehouse, loading } = usePermissions()
  const { data: session } = useSession()
  const isSystemAdmin = session?.user?.name === 'admin' || session?.user?.email?.startsWith('admin@')
  const isWmsAdmin = isSystemAdmin || hasPermissionInAnyWarehouse("role:manage")
  
  const hasAccessToThisWarehouse = isWmsAdmin || roles.some(r => r.warehouseId === id)

  const fetchHierarchy = async () => {
    setIsLoading(true)
    try {
      const data = await getWarehouseHierarchy(id)
      setHierarchy(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!loading && id) {
      if (hasAccessToThisWarehouse) {
        fetchHierarchy()
      } else {
        setIsLoading(false)
      }
    }
  }, [id, loading, hasAccessToThisWarehouse])

  if (loading || isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasAccessToThisWarehouse) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[300px]">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Không có quyền truy cập</h2>
        <p className="text-muted-foreground text-xs max-w-sm mt-1 mb-6 leading-relaxed">
          Tài khoản của bạn không được phân công quản lý hoặc truy cập sơ đồ của kho hàng này.
        </p>
        <Button onClick={() => router.push('/wms/layout')} className="bg-[#C41E3A] hover:bg-[#A01830] text-white text-xs h-9 rounded-lg">
          Quay lại danh sách kho
        </Button>
      </div>
    )
  }

  if (!hierarchy) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 min-h-[300px]">
        <p className="text-lg text-muted-foreground">Không tìm thấy kho hàng</p>
        <Button onClick={() => router.push('/wms/layout')}>Quay lại</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/wms/layout')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse: {hierarchy.name}</h1>
          <p className="text-muted-foreground font-mono">Code: {hierarchy.code}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-card rounded-lg border p-4">
        <HierarchyTree hierarchy={hierarchy} onRefresh={fetchHierarchy} />
      </div>
    </div>
  )
}
