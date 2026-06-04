"use client"

import { useState, useEffect } from "react"
import { InboundReceiptDto } from "@/types/wms-inbound"
import { getReceipts } from "@/lib/api/wms-inbound"
import { ReceiptsTable } from "@/components/wms/inbound/ReceiptsTable"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, ClipboardList, Layers, AlertCircle, CheckCircle2, Search, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

export default function InboundReceiptsPage() {
  const [receipts, setReceipts] = useState<InboundReceiptDto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const { activeWarehouseId } = useWarehouseContext()

  // Fetch receipts list
  const fetchReceipts = async () => {
    setIsLoading(true)
    try {
      const data = await getReceipts(activeWarehouseId || undefined)
      setReceipts(data)
    } catch (error) {
      toast.error("Lỗi khi tải danh sách phiếu nhập")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReceipts()
  }, [activeWarehouseId])

  // Filter logic
  const filteredReceipts = receipts.filter(
    (r) =>
      r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate statistics widgets
  const totalReceipts = receipts.length
  const pendingReceipts = receipts.filter(r => r.status === 'Pending').length
  const partiallyReceived = receipts.filter(r => r.status === 'PartiallyReceived').length
  const closedReceipts = receipts.filter(r => r.status === 'Closed').length

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Quản Lý Phiếu Nhập Kho (Inbound Receipts)
          </h1>
          <p className="text-muted-foreground mt-1">
            Theo dõi, kiểm đếm và quản lý tiến độ nhập hàng từ các Nhà cung cấp/Chủ hàng vào các ô kệ Receiving.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchReceipts} 
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Analytical widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Total Receipts */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng số Phiếu Nhập
            </CardTitle>
            <Layers className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalReceipts}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Toàn bộ các phiếu nhập kho đã được khởi tạo.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Pending Receipts */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-sky-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Phiếu Đang Chờ Nhận
            </CardTitle>
            <ClipboardList className="h-4.5 w-4.5 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-sky-600 dark:text-sky-400">
              {isLoading ? "..." : pendingReceipts}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Phiếu nhập đang chờ xe hàng cập bến để kiểm đếm.
            </CardDescription>
          </CardContent>
        </Card>

        {/* PartiallyReceived Receipts */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Nhận Hàng Một Phần
            </CardTitle>
            <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400 animate-pulse">
              {isLoading ? "..." : partiallyReceived}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đơn hàng giao thiếu, đang kiểm đếm dở dang.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Closed Receipts */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Phiếu Đã Hoàn Tất
            </CardTitle>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : closedReceipts}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Phiếu nhập đã được chốt và đóng vĩnh viễn.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-muted p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phiếu nhập theo mã phiếu hoặc mã đơn hàng gốc..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Inbound Receipts Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex-1 bg-card rounded-xl">
            <ReceiptsTable receipts={filteredReceipts} />
          </div>

          {filteredReceipts.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[250px]">
              <p className="text-muted-foreground text-lg">
                Không tìm thấy phiếu nhập nào khớp với từ khóa tìm kiếm.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
