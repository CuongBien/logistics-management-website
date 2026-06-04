"use client"

import { useState, useEffect } from "react"
import { InventoryItemDto } from "@/types/wms-inventory"
import { getInventoryList, reserveStock, releaseStock } from "@/lib/api/wms-inventory"
import { InventoryDataTable } from "@/components/wms/inventory/InventoryDataTable"
import { TransferStockDialog } from "@/components/wms/inventory/TransferStockDialog"
import { ReconcileDialog } from "@/components/wms/inventory/ReconcileDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Loader2, Boxes, Layers, ShieldCheck, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/button"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

export default function InventoryOverviewPage() {
  const [inventoryList, setInventoryList] = useState<InventoryItemDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog States
  const [selectedItem, setSelectedItem] = useState<InventoryItemDto | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [reconcileOpen, setReconcileOpen] = useState(false)

  const { activeWarehouseId } = useWarehouseContext()

  // Fetch all inventory list
  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const data = await getInventoryList(activeWarehouseId || undefined)
      setInventoryList(data)
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu tồn kho")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [activeWarehouseId])

  // Action dispatcher
  const handleAction = async (action: 'transfer' | 'reconcile' | 'reserve' | 'release', item: InventoryItemDto) => {
    setSelectedItem(item)
    if (action === 'reserve') {
      try {
        await reserveStock(item.id, 5) // Default demo amount for fast verification
        toast.success(`Đã bảo lưu thành công 5 hàng hóa cho SKU: ${item.sku}`)
        fetchInventory()
      } catch (e: any) {
        toast.error(e.message || "Bảo lưu thất bại")
      }
    } else if (action === 'release') {
      try {
        await releaseStock(item.id, 5) // Default demo amount
        toast.success(`Đã giải phóng thành công 5 hàng hóa đang bảo lưu cho SKU: ${item.sku}`)
        fetchInventory()
      } catch (e: any) {
        toast.error(e.message || "Giải phóng thất bại")
      }
    } else if (action === 'transfer') {
      setTransferOpen(true)
    } else if (action === 'reconcile') {
      setReconcileOpen(true)
    }
  }

  // Calculate statistics metrics
  const totalSkus = new Set(inventoryList.map(item => item.sku)).size
  const totalPhysicalQty = inventoryList.reduce((sum, item) => sum + item.quantityOnHand, 0)
  const totalReservedQty = inventoryList.reduce((sum, item) => sum + (item.quantityOnHand - item.availableQuantity), 0)

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Quản Lý Tồn Kho (Inventory)
          </h1>
          <p className="text-muted-foreground mt-1">
            Giám sát mức tồn kho vật lý thực tế, hàng khả dụng vận hành, thực thi luân chuyển kệ và quản lý bảo lưu xuất kho.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchInventory} 
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* SKUs Metric */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng Mã Sản Phẩm (SKU)
            </CardTitle>
            <Layers className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalSkus}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Mã sản phẩm độc nhất hiện hữu trên tất cả các kệ.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Physical QuantityOnHand Metric */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng Tồn Kho Vật Lý
            </CardTitle>
            <Boxes className="h-4.5 w-4.5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalPhysicalQty.toLocaleString()}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Tổng số lượng sản phẩm vật lý (On Hand) đang lưu trữ.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Reserved Stock Metric */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Hàng Đang Bảo Lưu
            </CardTitle>
            <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-rose-500">
              {isLoading ? "..." : totalReservedQty.toLocaleString()}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Số lượng hàng được giữ chỗ (Reserved) để chuẩn bị xuất kho.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Master Data Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 bg-card rounded-xl">
          <InventoryDataTable data={inventoryList} onAction={handleAction} />
        </div>
      )}

      {/* Interactive Action Dialogs */}
      <TransferStockDialog 
        item={selectedItem}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onSuccess={fetchInventory}
      />
      <ReconcileDialog 
        item={selectedItem}
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
        onSuccess={fetchInventory}
      />
    </div>
  )
}
