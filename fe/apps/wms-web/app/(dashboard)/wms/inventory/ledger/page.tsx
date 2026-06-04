"use client"

import { useState, useEffect } from "react"
import { getGlobalLedgers } from "@/lib/api/wms-inventory"
import { getWarehouses } from "@/lib/api/wms-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Input } from "@repo/ui/components/input"
import { Loader2, RefreshCw, Search, History, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Building2, HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { WarehouseContextSelector } from "@/components/wms/rbac/WarehouseContextSelector"

export default function InventoryLedgerPage() {
  const [ledgers, setLedgers] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [skuQuery, setSkuQuery] = useState("")

  const { activeWarehouseId } = useWarehouseContext()

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [ledgerData, whData] = await Promise.all([
        getGlobalLedgers(activeWarehouseId || undefined, skuQuery || undefined),
        getWarehouses()
      ])
      setLedgers(ledgerData)
      setWarehouses(whData)
    } catch (e) {
      toast.error("Không thể tải danh sách nhật ký tồn kho")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeWarehouseId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  // Helper mapping reasons
  const getReasonBadge = (reason: number) => {
    switch (reason) {
      case 1:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold"><ArrowDownRight className="h-3 w-3 mr-1" /> Nhập kho (Inbound)</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Giữ hàng (Reserve)</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-bold">Hủy giữ hàng (Release)</Badge>;
      case 4:
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold"><ArrowUpRight className="h-3 w-3 mr-1" /> Lấy hàng (Pick)</Badge>;
      case 5:
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold">Đóng gói (Pack)</Badge>;
      case 6:
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 font-bold">Xuất kho (Ship)</Badge>;
      case 8:
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold">Điều chỉnh tăng</Badge>;
      case 9:
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold">Điều chỉnh giảm</Badge>;
      case 11:
        return <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/20 font-bold"><ArrowDownRight className="h-3 w-3 mr-1" /> Nhận trung chuyển</Badge>;
      case 12:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold"><ArrowLeftRight className="h-3 w-3 mr-1" /> Dịch chuyển kệ (Transfer)</Badge>;
      case 13:
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-bold">Đơn hàng hủy</Badge>;
      default:
        return <Badge variant="outline">Giao dịch ({reason})</Badge>;
    }
  }

  const getWarehouseName = (whId: string) => {
    const wh = warehouses.find(w => w.id === whId)
    return wh ? wh.name : "Warehouse"
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Nhật Ký Tồn Kho (Inventory Ledger)
          </h1>
          <p className="text-muted-foreground mt-1">
            Tra cứu lịch sử biến động số dư chi tiết (Audit Trail) của từng ô kệ, mã hàng hóa trong toàn hệ thống.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <WarehouseContextSelector />
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Searching Bar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3 bg-card border border-muted p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nhập mã hàng SKU cần lọc..."
            className="pl-10 bg-background"
            value={skuQuery}
            onChange={(e) => setSkuQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9">
          Tìm kiếm
        </Button>
      </form>

      {/* Row 2: List Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold w-[170px]">Thời Gian</TableHead>
                <TableHead className="font-bold">Mã SKU</TableHead>
                <TableHead className="font-bold">Kho hàng</TableHead>
                <TableHead className="font-bold">Lý Do Biến Động</TableHead>
                <TableHead className="font-bold text-right">Lượng Thay Đổi (Delta)</TableHead>
                <TableHead className="font-bold text-right">Số Dư Sau Thay Đổi</TableHead>
                <TableHead className="font-bold">Chứng Từ Tham Chiếu</TableHead>
                <TableHead className="font-bold">Người Thực Hiện</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    Chưa có giao dịch tồn kho nào ghi nhận trong hệ thống.
                  </TableCell>
                </TableRow>
              ) : (
                ledgers.map((l) => {
                  const isPositive = l.deltaQty > 0
                  const isZero = l.deltaQty === 0

                  return (
                    <TableRow key={l.id} className="hover:bg-muted/15 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground align-middle">
                        {format(new Date(l.occurredAt), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-primary align-middle">
                        {l.sku}
                      </TableCell>
                      <TableCell className="align-middle text-sm font-semibold flex items-center gap-1 mt-1.5 border-0">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {getWarehouseName(l.warehouseId)}
                      </TableCell>
                      <TableCell className="align-middle">
                        {getReasonBadge(l.reason)}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-extrabold align-middle ${isZero ? "text-slate-500" : isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {isZero ? `0` : isPositive ? `+${l.deltaQty}` : l.deltaQty}
                      </TableCell>
                      <TableCell className="text-right font-mono font-extrabold text-slate-900 dark:text-slate-100 align-middle">
                        {l.balanceAfter.toLocaleString()}
                      </TableCell>
                      <TableCell className="align-middle font-mono text-xs text-muted-foreground">
                        {l.referenceType ? `${l.referenceType}: ` : ""}
                        <span className="font-bold text-slate-700 dark:text-slate-300">{l.referenceId || "N/A"}</span>
                      </TableCell>
                      <TableCell className="align-middle text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {l.operatorSub || "system"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
