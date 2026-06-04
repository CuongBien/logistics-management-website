"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { getWarehouses } from "@/lib/api/wms-layout"
import { WarehouseDto } from "@/types/wms-layout"
import { Loader2, Warehouse as WarehouseIcon, MapPin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SelectWarehousePage() {
  const router = useRouter()
  const { setActiveWarehouseId } = useWarehouseContext()
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isNavigating, setIsNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchWarehouses() {
      try {
        setLoading(true)
        const data = await getWarehouses(false) // Fetches based on their permissions
        setWarehouses(data || [])
        setLoading(false)
      } catch (err) {
        console.error("Failed to fetch warehouses", err)
        setError("Không thể tải danh sách kho. Vui lòng thử lại sau.")
        setLoading(false)
      }
    }

    fetchWarehouses()
  }, [router, setActiveWarehouseId])

  const handleSelect = (id: string) => {
    setIsNavigating(true)
    setActiveWarehouseId(id)
    router.push("/") // Can redirect to dashboard or WMS layout
  }

  if (loading || isNavigating) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C41E3A]" />
        {isNavigating && <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang chuyển vào hệ thống...</p>}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-rose-500 font-medium">{error}</p>
      </div>
    )
  }

  if (warehouses.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
          <WarehouseIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Không tìm thấy kho</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Tài khoản của bạn chưa được phân quyền truy cập bất kỳ kho nào trong hệ thống.
          Vui lòng liên hệ quản trị viên.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C41E3A] to-[#A01830] text-white shadow-xl shadow-[#C41E3A]/20 mb-6">
          <WarehouseIcon className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">Chọn Kho Làm Việc</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Tài khoản của bạn có quyền truy cập ở nhiều kho. Vui lòng chọn kho mà bạn muốn thao tác để tiếp tục.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map((wh) => (
          <div 
            key={wh.id}
            onClick={() => handleSelect(wh.id)}
            className="group relative flex flex-col bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#C41E3A]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-8 w-8 rounded-full bg-[#C41E3A]/10 flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-[#C41E3A]" />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-[#C41E3A]/5 transition-colors duration-300">
                <WarehouseIcon className="h-6 w-6 text-muted-foreground group-hover:text-[#C41E3A] transition-colors duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-card-foreground truncate group-hover:text-[#C41E3A] transition-colors duration-300">
                  {wh.name}
                </h3>
                <span className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground mt-1">
                  {wh.code}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 mt-auto pt-4 border-t border-border/50">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {wh.locationText || "Chưa cập nhật địa chỉ"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
