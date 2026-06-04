"use client"

import { useState, useEffect } from "react"
import { OutboundOrderDto } from "@/types/wms-outbound"
import { getOrders } from "@/lib/api/wms-outbound"
import { OutboundOrderTable } from "@/components/wms/outbound/OutboundOrderTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, FileText, Layers, AlertCircle, CheckCircle2, Search, RefreshCw, ShoppingCart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

export default function OutboundOrdersPage() {
  const [orders, setOrders] = useState<OutboundOrderDto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [splittingId, setSplittingId] = useState<string | null>(null)
  
  const { activeWarehouseId } = useWarehouseContext()

  // Fetch outbound orders list
  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const data = await getOrders(activeWarehouseId || undefined)
      setOrders(data)
    } catch (error) {
      toast.error("Lỗi khi tải danh sách đơn xuất kho")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [activeWarehouseId])

  // Filter logic
  const filteredOrders = orders.filter(
    (o) =>
      o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tenantId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate statistics widgets
  const totalOrders = orders.length
  const newOrAllocated = orders.filter(o => o.status === 'New' || o.status === 'Allocated' || o.status === 'Allocating').length
  const packingOrPacked = orders.filter(o => o.status === 'Packing' || o.status === 'Packed').length
  const shippedOrders = orders.filter(o => o.status === 'Shipped').length

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Quản Lý Đơn Xuất Kho (Outbound Orders)
          </h1>
          <p className="text-muted-foreground mt-1">
            Giám sát, phân tích tiến độ xử lý và phê duyệt luồng đơn hàng xuất từ các Chủ hàng ra xe Last-mile.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchOrders} 
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics analytical widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng số Đơn Xuất
            </CardTitle>
            <Layers className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalOrders}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Toàn bộ các đơn xuất đã ghi nhận trong hệ thống.
            </CardDescription>
          </CardContent>
        </Card>

        {/* New / Allocated (Awaiting Pick) */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-sky-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Đơn Chờ Lấy Hàng
            </CardTitle>
            <ShoppingCart className="h-4.5 w-4.5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-sky-600 dark:text-sky-400">
              {isLoading ? "..." : newOrAllocated}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đơn đang được cấp phát hoặc chờ gom sóng xuất.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Packing / Packed */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Đơn Đang Đóng Gói
            </CardTitle>
            <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : packingOrPacked}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đơn đang được chia chọn Put-to-wall hoặc đóng thùng.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Shipped */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Đơn Đã Xuất Kho
            </CardTitle>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : shippedOrders}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đơn hàng đã bàn giao xe tải vận chuyển rời kho.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-muted p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm đơn xuất theo số đơn hàng (OrderNo) hoặc mã chủ hàng (Tenant)..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Master Outbound Orders Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex-1 bg-card rounded-xl">
            <OutboundOrderTable orders={filteredOrders} />
          </div>

          {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[250px]">
              <p className="text-muted-foreground text-lg">
                Không tìm thấy đơn xuất kho nào khớp bộ lọc.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
