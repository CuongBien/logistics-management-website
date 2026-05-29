"use client"

import { useState, useEffect } from "react"
import { WarehouseDto } from "@/types/wms-layout"
import { getWarehouses } from "@/lib/api/wms-layout"
import { WarehouseFormDialog } from "@/components/wms/layout/WarehouseFormDialog"
import { WarehouseCard } from "@/components/wms/layout/WarehouseCard"
import { Loader2, Search, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function WarehouseListPage() {
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const fetchWarehouses = async () => {
    setIsLoading(true)
    try {
      const data = await getWarehouses()
      setWarehouses(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const filteredWarehouses = warehouses.filter(
    (wh) =>
      wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wh.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Cấu Trúc Kho Bãi
          </h1>
          <p className="text-muted-foreground mt-1">
            Thiết lập và quản lý cấu trúc vật lý phân cấp: Kho (Warehouse) → Dãy (Block) → Khu vực (Zone) → Vị trí kệ (Bin).
          </p>
        </div>
        <div className="shrink-0">
          <WarehouseFormDialog onCreated={fetchWarehouses} />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-muted p-3 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm kho theo tên hoặc mã kho..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 hidden sm:flex">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading state or Warehouse list grid */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarehouses.map((wh) => (
              <WarehouseCard key={wh.id} warehouse={wh} />
            ))}
          </div>

          {filteredWarehouses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[250px]">
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery ? "Không tìm thấy kho nào khớp với từ khóa tìm kiếm." : "Chưa có kho hàng nào được tạo."}
              </p>
              {!searchQuery && <WarehouseFormDialog onCreated={fetchWarehouses} />}
            </div>
          )}
        </>
      )}
    </div>
  )
}
