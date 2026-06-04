"use client"

import { useState, useEffect } from "react"
import { getReconciliationReports, runGlobalReconciliation, resolveReconciliationReport, ignoreReconciliationReport } from "@/lib/api/wms-inventory"
import { getWarehouses } from "@/lib/api/wms-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, Scale, FileSpreadsheet, Play, Building2, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { WarehouseContextSelector } from "@/components/wms/rbac/WarehouseContextSelector"

export default function ReconcilePage() {
  const [reports, setReports] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReconciling, setIsReconciling] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("1") // Default Pending = "1"
  const [skuQuery, setSkuQuery] = useState("")

  // Dialog Action States
  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<"resolve" | "ignore" | null>(null)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [notes, setNotes] = useState("")

  const { activeWarehouseId } = useWarehouseContext()

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [reportData, whData] = await Promise.all([
        getReconciliationReports(activeWarehouseId || undefined),
        getWarehouses()
      ])
      setReports(reportData)
      setWarehouses(whData)
    } catch (e) {
      toast.error("Không thể tải danh sách báo cáo chênh lệch đối soát")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeWarehouseId])

  const handleRunReconciliation = async () => {
    setIsReconciling(true)
    try {
      const res = await runGlobalReconciliation(activeWarehouseId || undefined)
      if (res.success) {
        if (res.discrepanciesFound > 0) {
          toast.warning(`Đối chiếu hoàn tất! Đã quét ${res.itemsProcessed} mặt hàng và phát hiện ${res.discrepanciesFound} sai lệch mới cần xử lý.`)
        } else {
          toast.success(`Đối chiếu hoàn tất! Quét sạch ${res.itemsProcessed} mặt hàng và không phát hiện bất kỳ sai lệch nào.`)
        }
        loadData()
      }
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi chạy lệnh đối chiếu")
    } finally {
      setIsReconciling(false)
    }
  }

  const handleActionClick = (report: any, type: "resolve" | "ignore") => {
    setSelectedReport(report)
    setActionType(type)
    setNotes("")
    setActionOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedReport || !actionType) return
    setIsLoading(true)
    setActionOpen(false)
    try {
      if (actionType === "resolve") {
        await resolveReconciliationReport(selectedReport.id, notes)
        toast.success(`Đã cân bằng tồn kho SKU ${selectedReport.sku} khớp với sổ sách Ledger!`)
      } else {
        await ignoreReconciliationReport(selectedReport.id, notes)
        toast.success(`Đã bỏ qua chênh lệch đối soát cho SKU ${selectedReport.sku}.`)
      }
      loadData()
    } catch (e: any) {
      toast.error(e.message || "Thao tác thất bại")
    } finally {
      setIsLoading(false)
      setSelectedReport(null)
      setActionType(null)
    }
  }

  // Format Status Badge
  const formatStatus = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5"><AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> Chờ xử lý</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5"><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Đã cân bằng</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-500 border-zinc-200 font-bold px-2 py-0.5">Bỏ qua (Ignored)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const getWarehouseName = (whId: string) => {
    const wh = warehouses.find(w => w.id === whId)
    return wh ? wh.name : "Warehouse"
  }

  // Filter and Search logic
  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status.toString() === statusFilter
    const matchesSku = r.sku.toLowerCase().includes(skuQuery.toLowerCase())
    return matchesStatus && matchesSku
  })

  // Calculations KPI Widgets
  const pendingCount = reports.filter(r => r.status === 1).length
  const resolvedCount = reports.filter(r => r.status === 2).length

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Đối Chiếu & Kiểm Kê Tồn Kho (Inventory Reconciliation)
          </h1>
          <p className="text-muted-foreground mt-1">
            Quét và phát hiện sự sai lệch giữa số lượng tồn thực tế trên kệ (QuantityOnHand) và số dư lũy kế trên sổ nhật ký (Inventory Ledger).
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <WarehouseContextSelector />
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading || isReconciling}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${(isLoading && !isReconciling) ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={handleRunReconciliation}
            disabled={isLoading || isReconciling}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm h-9 flex items-center gap-1.5"
          >
            {isReconciling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang quét đối soát...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Chạy đối chiếu hệ thống
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Pending Discrepancies */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Sai Lệch Kiểm Kho Chờ Xử Lý
            </CardTitle>
            <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : pendingCount} biên bản
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Các chênh lệch số lượng cần phê duyệt điều chỉnh hoặc cân bằng kho.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Resolved Discrepancies */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Sai Lệch Đã Được Cân Bằng
            </CardTitle>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : resolvedCount} biên bản
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đã duyệt điều chỉnh cân bằng số liệu tồn kho theo sổ Ledger.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="bg-card border border-muted p-3.5 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 self-start sm:self-auto w-full sm:w-auto">
          {[
            { id: "1", label: "Chờ xử lý (Pending)" },
            { id: "2", label: "Đã xử lý (Resolved)" },
            { id: "3", label: "Bỏ qua (Ignored)" },
            { id: "all", label: "Tất cả" },
          ].map((status) => (
            <Button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              variant={statusFilter === status.id ? "default" : "outline"}
              className={`h-8 text-xs px-4 rounded ${
                statusFilter === status.id 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold" 
                  : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border-slate-200"
              }`}
            >
              {status.label}
            </Button>
          ))}
        </div>

        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Lọc nhanh theo SKU..."
            className="pl-10 bg-background h-8 text-xs"
            value={skuQuery}
            onChange={(e) => setSkuQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: List Table */}
      {isLoading && !isReconciling ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold">Mã SKU</TableHead>
                <TableHead className="font-bold">Kho Hàng</TableHead>
                <TableHead className="font-bold">Mã Ô Kệ (Bin)</TableHead>
                <TableHead className="font-bold text-right">Số Tồn Kho (Snapshot)</TableHead>
                <TableHead className="font-bold text-right">Số Sổ Sách (Ledger)</TableHead>
                <TableHead className="font-bold text-right">Độ Lệch</TableHead>
                <TableHead className="font-bold">Ngày Phát Hiện</TableHead>
                <TableHead className="font-bold text-center">Trạng Thái</TableHead>
                {statusFilter === "1" && <TableHead className="font-bold text-right w-[200px]">Hành Động</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={statusFilter === "1" ? 9 : 8} className="text-center py-12 text-muted-foreground text-sm">
                    Không tìm thấy biên bản chênh lệch đối soát nào khớp bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => {
                  const isOverage = report.difference > 0

                  return (
                    <TableRow key={report.id} className="hover:bg-muted/15 transition-colors">
                      <TableCell className="font-mono font-bold text-primary align-middle">
                        {report.sku}
                      </TableCell>
                      <TableCell className="align-middle text-sm font-semibold">
                        {getWarehouseName(report.warehouseId)}
                      </TableCell>
                      <TableCell className="font-mono text-sm align-middle font-bold text-slate-700">
                        {report.binId}
                      </TableCell>
                      <TableCell className="text-right font-mono align-middle">
                        {report.snapshotQty}
                      </TableCell>
                      <TableCell className="text-right font-mono align-middle">
                        {report.ledgerQty}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-extrabold align-middle ${isOverage ? "text-emerald-600" : "text-rose-600"}`}>
                        {isOverage ? `+${report.difference}` : report.difference}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground align-middle">
                        {format(new Date(report.detectedAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        {formatStatus(report.status)}
                      </TableCell>
                      {statusFilter === "1" && (
                        <TableCell className="text-right align-middle space-x-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleActionClick(report, "resolve")}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Cân bằng kho
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleActionClick(report, "ignore")}
                            className="h-8 text-rose-500 hover:bg-rose-500/10"
                          >
                            Bỏ qua
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "ignore" ? "text-rose-500" : "text-emerald-600"}`}>
              {actionType === "ignore" ? (
                <>
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  Bỏ Qua Lệch Đối Soát
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Cân Bằng Tồn Kho
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "ignore" ? (
                `Hệ thống sẽ bỏ qua và đánh dấu biên bản chênh lệch của SKU ${selectedReport?.sku} là Ignored. Số QuantityOnHand vật lý trên kệ vẫn giữ nguyên là ${selectedReport?.snapshotQty}.`
              ) : (
                `Hành động này sẽ cập nhật số tồn thực tế (QuantityOnHand) của SKU ${selectedReport?.sku} về bằng số lượng ghi nhận trên Ledger là ${selectedReport?.ledgerQty} và sinh Ledger điều chỉnh cân đối.`
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="notes">Giải trình lý do nghiệp vụ</Label>
            <Input
              id="notes"
              placeholder="e.g. Điều chỉnh theo kết quả đếm lại thực tế, Sai lệch do lỗi quét tem..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setActionOpen(false)}>
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              className={actionType === "ignore" ? "bg-rose-500 hover:bg-rose-600 text-white font-bold" : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"}
            >
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
