"use client"

import { useEffect, useState } from "react"
import { 
  getCycleCountTasks, 
  generateCycleCount,
  submitCycleCount,
  approveCycleCount
} from "@/lib/api/wms-tasks"
import { CycleCountTaskDto } from "@/types/wms-tasks"
import { AdjustmentApprovalDialog } from "@/components/wms/tasks/AdjustmentApprovalDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Badge } from "@repo/ui/components/badge"
import { Input } from "@repo/ui/components/input"
import { Button } from "@repo/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@repo/ui/components/table"
import { Skeleton } from "@repo/ui/components/skeleton"
import {
  ClipboardCheck,
  Search,
  Plus,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Cpu,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@repo/ui/components/dialog"
import { Label } from "@repo/ui/components/label"

export default function CycleCountTasksPage() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState<CycleCountTaskDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Operator inline inputs state
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [submittingRow, setSubmittingRow] = useState<Record<string, boolean>>({})
  
  // Task creation state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creationMethod, setCreationMethod] = useState<"auto" | "manual">("auto")
  const [manualBin, setManualBin] = useState("")
  const [manualSku, setManualSku] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Approval dialog state
  const [selectedTask, setSelectedTask] = useState<CycleCountTaskDto | null>(null)
  const [isApprovalOpen, setIsApprovalOpen] = useState(false)
  
  const { activeWarehouseId } = useWarehouseContext()

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await getCycleCountTasks(activeWarehouseId || undefined)
      setTasks(data)
    } catch (e: any) {
      toast.error("Không thể tải danh sách tác vụ kiểm kê (Cycle Count)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [activeWarehouseId])

  const handleGenerateCycleCount = async () => {
    if (!activeWarehouseId) {
      toast.error("Vui lòng chọn kho làm việc")
      return
    }
    try {
      setIsGenerating(true)
      let generated;
      if (creationMethod === "auto") {
        generated = await generateCycleCount(activeWarehouseId, "ST-BABY-03", "BIMTA-HUG-M")
        toast.success(`Đã tự động khởi tạo thành công phiên kiểm kho mới tại ô kệ ST-BABY-03!`)
      } else {
        if (!manualBin.trim() || !manualSku.trim()) {
          toast.error("Vui lòng nhập đầy đủ Mã Ô kệ và Mã SKU sản phẩm")
          return
        }
        generated = await generateCycleCount(activeWarehouseId, manualBin.toUpperCase().trim(), manualSku.toUpperCase().trim())
        toast.success(`Đã phát lệnh kiểm đếm thủ công thành công cho SKU ${manualSku.toUpperCase().trim()} tại ô kệ ${manualBin.toUpperCase().trim()}.`)
      }
      setIsCreateOpen(false)
      setManualBin("")
      setManualSku("")
      await fetchTasks()
    } catch (e: any) {
      toast.error(e.message || "Tạo lệnh kiểm kho thất bại")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmitCount = async (taskId: string) => {
    const qtyText = counts[taskId]
    if (qtyText === undefined || qtyText.trim() === "") {
      toast.error("Vui lòng nhập số lượng kiểm đếm")
      return
    }
    const qty = parseInt(qtyText, 10)
    if (isNaN(qty) || qty < 0) {
      toast.error("Vui lòng nhập số lượng hợp lệ")
      return
    }

    try {
      setSubmittingRow(prev => ({ ...prev, [taskId]: true }))
      await submitCycleCount(taskId, qty)
      toast.success("Đã ghi nhận kết quả kiểm đếm thành công!")
      await fetchTasks()
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gửi kết quả kiểm đếm")
    } finally {
      setSubmittingRow(prev => ({ ...prev, [taskId]: false }))
    }
  }

  const handleOpenApproval = (task: CycleCountTaskDto) => {
    setSelectedTask(task)
    setIsApprovalOpen(true)
  }

  // Client-side search filtering by SKU or Task ID or Bin Code
  const filteredTasks = tasks.filter(
    (task) => {
      const bin = task.binCode || (task as any).binId || ""
      return (
        task.sku.toLowerCase().includes(search.toLowerCase()) ||
        task.id.toLowerCase().includes(search.toLowerCase()) ||
        bin.toLowerCase().includes(search.toLowerCase())
      )
    }
  )

  // Compute metrics
  const totalTasks = tasks.length
  const pendingCount = tasks.filter((t) => t.status === "Pending").length
  const awaitingReviewCount = tasks.filter((t) => t.status === "Counted").length
  
  const discrepancyTasksCount = tasks.filter(
    (t) => t.status !== "Pending" && t.expectedQty !== t.countedQty
  ).length

  const approvedCount = tasks.filter((t) => t.status === "Approved").length

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header bar */}
      <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
            <ClipboardCheck className="h-5 w-5 text-[#C41E3A]" />
            Control Tower: Giám Sát Kiểm Kê Kho (Cycle Count Monitor)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lập kế hoạch kiểm kho và xét duyệt sai lệch chênh lệch tồn lý thuyết so với số liệu kiểm đếm thực tế của nhân viên.
          </p>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={fetchTasks}
          className="h-9 text-xs rounded-md border-muted text-muted-foreground hover:text-foreground self-start md:self-center bg-card shadow-sm"
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
          Làm mới
        </Button>
      </div>

      {/* Tabs navigation under /wms/tasks/ */}
      <div className="px-6">
        <div className="border-b border-muted flex gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2.5">
          <Link
            href="/wms/tasks/putaway"
            className={`transition-colors hover:text-foreground relative ${
              pathname === "/wms/tasks/putaway"
                ? "text-[#C41E3A] after:absolute after:bottom-[-11px] after:left-0 after:w-full after:h-[2px] after:bg-[#C41E3A]"
                : ""
            }`}
          >
            Cất Hàng (Putaway)
          </Link>
          <Link
            href="/wms/tasks/replenishment"
            className={`transition-colors hover:text-foreground relative ${
              pathname === "/wms/tasks/replenishment"
                ? "text-[#C41E3A] after:absolute after:bottom-[-11px] after:left-0 after:w-full after:h-[2px] after:bg-[#C41E3A]"
                : ""
            }`}
          >
            Châm Hàng (Replenishment)
          </Link>
          <Link
            href="/wms/tasks/cycle-count"
            className={`transition-colors hover:text-foreground relative ${
              pathname === "/wms/tasks/cycle-count"
                ? "text-[#C41E3A] after:absolute after:bottom-[-11px] after:left-0 after:w-full after:h-[2px] after:bg-[#C41E3A]"
                : ""
            }`}
          >
            Kiểm Kê Kho (Cycle Count)
          </Link>
          <Link
            href="/wms/tasks/cross-dock"
            className="transition-colors hover:text-foreground"
          >
            Luân Chuyển Thẳng (Cross-Dock)
          </Link>
        </div>
      </div>

      <div className="px-6 space-y-4 flex-1 overflow-y-auto pb-6">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổng tác vụ kiểm kê
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-foreground">
                {loading ? <Skeleton className="h-8 w-16" /> : totalTasks}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Các ô kệ đã kiểm đếm hôm nay
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 animate-pulse" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tác vụ lệch tồn kho
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {loading ? <Skeleton className="h-8 w-16" /> : discrepancyTasksCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Sai lệch thực tế vs. lý thuyết ⚠️
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chờ duyệt điều chỉnh
              </CardTitle>
              <Scale className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {loading ? <Skeleton className="h-8 w-16" /> : awaitingReviewCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Đã đếm xong, chờ Quản đốc xét
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đã Duyệt Điều Chỉnh
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? <Skeleton className="h-8 w-16" /> : approvedCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Đã cân đối số liệu kho vật lý
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Generate / Action Toolbar */}
        <div className="bg-card border border-muted rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo SKU, Ô kệ, hoặc Mã Tác Vụ..."
              className="pl-9 h-9 rounded-md text-xs bg-background border-muted"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-extrabold text-xs h-9 px-4 rounded-md shadow-sm w-full sm:w-auto flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Phát Lệnh Đếm Kho (Create Task)
          </Button>
        </div>

        {/* DataTable Monitor */}
        <div className="border border-muted bg-card rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-muted">
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-32">
                  Mã Tác Vụ
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-center">
                  Vị trí (Bin)
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-40">
                  Mã SKU Sản Phẩm
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-center">
                  Tồn Hệ Thống
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-48 text-center">
                  Thực Tế Đếm
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-center">
                  Sai Lệch (Diff)
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground">
                  Nhân Viên Kho
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-32 text-center">
                  Trạng Thái
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36 text-right">
                  Hành Động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-muted">
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardCheck className="h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
                      <p className="font-semibold">Không tìm thấy tác vụ kiểm kê kho nào</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        Nhấn nút "Tạo Lệnh Đếm Kho (Auto-generate)" bên phải để khởi tạo một phiên kiểm đếm vị trí.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const expected = task.expectedQty
                  const counted = task.countedQty
                  const bin = task.binCode || (task as any).binId || ""
                  const hasDiscrepancy = counted !== undefined && counted !== null && expected !== counted
                  const diff = counted !== undefined && counted !== null ? counted - expected : null

                  return (
                    <TableRow
                      key={task.id}
                      className={`hover:bg-muted/10 border-b border-muted transition-colors ${
                        hasDiscrepancy && task.status !== "Pending"
                          ? "bg-rose-500/[0.03] dark:bg-rose-500/[0.06] hover:bg-rose-500/[0.06] border-l border-l-rose-500"
                          : ""
                      }`}
                    >
                      {/* Task ID */}
                      <TableCell className="text-xs font-bold font-mono text-[#C41E3A] tracking-wider uppercase">
                        {task.id}
                      </TableCell>
                      
                      {/* Bin Code */}
                      <TableCell className="text-xs text-center font-bold font-mono text-muted-foreground">
                        {bin}
                      </TableCell>
                      
                      {/* SKU Code */}
                      <TableCell className="text-xs font-bold font-mono text-foreground uppercase">
                        {task.sku}
                      </TableCell>
                      
                      {/* Expected Qty */}
                      <TableCell className="text-xs text-center font-semibold font-mono text-muted-foreground">
                        {expected}
                      </TableCell>
                      
                      {/* Counted Qty Input for operator / displays result */}
                      <TableCell className="text-xs text-center font-bold font-mono">
                        {task.status === "Pending" ? (
                          <div className="flex items-center gap-1.5 justify-center">
                            <Input
                              type="number"
                              min="0"
                              placeholder="SL đếm..."
                              className="w-20 h-7 text-[11px] bg-background border-muted px-1.5 rounded"
                              value={counts[task.id] || ""}
                              onChange={(e) => setCounts(prev => ({ ...prev, [task.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSubmitCount(task.id)}
                              disabled={submittingRow[task.id]}
                              className="h-7 text-[10px] font-bold px-2 bg-slate-800 hover:bg-slate-700 text-white rounded"
                            >
                              {submittingRow[task.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Gửi"}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{counted}</span>
                        )}
                      </TableCell>
                      
                      {/* Difference */}
                      <TableCell className="text-xs text-center font-bold font-mono">
                        {diff === null ? (
                          <span className="text-muted-foreground/30">—</span>
                        ) : diff === 0 ? (
                          <span className="text-emerald-500">0</span>
                        ) : diff > 0 ? (
                          <span className="text-amber-500">+{diff}</span>
                        ) : (
                          <span className="text-rose-500">{diff}</span>
                        )}
                      </TableCell>
                      
                      {/* Operator */}
                      <TableCell className="text-xs font-semibold text-foreground">
                        {task.operatorName || (
                          <span className="text-muted-foreground font-normal italic text-[11px]">Chưa phân bổ</span>
                        )}
                      </TableCell>
                      
                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.status === "Pending"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : task.status === "Counted"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse"
                              : task.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              task.status === "Pending"
                                ? "bg-amber-500"
                                : task.status === "Counted"
                                ? "bg-blue-500 animate-ping"
                                : task.status === "Approved"
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {task.status === "Pending"
                            ? "Chờ đếm"
                            : task.status === "Counted"
                            ? "Chờ duyệt"
                            : task.status === "Approved"
                            ? "Đã duyệt"
                            : "Từ chối"}
                        </Badge>
                      </TableCell>
                      
                      {/* Actions Column */}
                      <TableCell className="text-right">
                        {task.status === "Counted" ? (
                          <Button
                            size="sm"
                            onClick={() => handleOpenApproval(task)}
                            className="bg-[#C41E3A] hover:bg-[#A01830] text-white text-[10px] font-bold h-7 px-3.5 rounded-md shadow-sm"
                          >
                            Xét Duyệt
                          </Button>
                        ) : task.status === "Pending" ? (
                          <span className="text-[10px] text-muted-foreground/60 italic font-medium">Đang kiểm...</span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenApproval(task)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-[10px] font-bold h-7 px-3.5 rounded-md transition-colors"
                          >
                            Xem Lịch Sử
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Adjustment Decision Approval Modal Dialog */}
      <AdjustmentApprovalDialog
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        task={selectedTask}
        onSuccess={fetchTasks}
      />

      {/* Initiate Cycle Count Session Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
        <DialogContent className="sm:max-w-[420px] bg-card border border-muted shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-extrabold text-lg">
              <Cpu className="h-5 w-5 text-[#C41E3A] animate-pulse" />
              Khởi Tạo Phiên Kiểm Kho
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Chọn phương thức phát lệnh tự động từ hệ thống hoặc chủ động chỉ định SKU/Bin để nhân viên đi kiểm đếm vật lý.
            </DialogDescription>
          </DialogHeader>

          {/* Dynamic Form Content */}
          <div className="space-y-4 my-2">
             {/* Selection Tab Group */}
             <div className="space-y-1.5">
               <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                 Phương Thức Khởi Tạo
               </Label>
               <div className="grid grid-cols-2 gap-2 bg-muted/60 p-1.5 rounded-xl border border-muted/30">
                 <button
                   type="button"
                   onClick={() => setCreationMethod("auto")}
                   className={`py-2 text-xs font-bold rounded-lg transition-all ${
                     creationMethod === "auto"
                       ? "bg-background text-foreground shadow-sm border border-muted/20"
                       : "text-muted-foreground hover:text-foreground"
                   }`}
                 >
                   Tự động (WMS Auto)
                 </button>
                 <button
                   type="button"
                   onClick={() => setCreationMethod("manual")}
                   className={`py-2 text-xs font-bold rounded-lg transition-all ${
                     creationMethod === "manual"
                       ? "bg-background text-[#C41E3A] shadow-sm border border-muted/20"
                       : "text-muted-foreground hover:text-foreground"
                   }`}
                 >
                   Chỉ định thủ công
                 </button>
               </div>
             </div>

             {/* Auto Method Description */}
             {creationMethod === "auto" ? (
               <div className="bg-[#C41E3A]/5 border border-[#C41E3A]/10 p-3.5 rounded-xl text-xs space-y-1.5 text-muted-foreground">
                 <p className="font-semibold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                   <Cpu className="h-3.5 w-3.5 text-[#C41E3A]" />
                   Thuật toán tự động sinh lệnh
                 </p>
                 <p className="leading-relaxed text-[11px]">
                   WMS sẽ quét ngẫu nhiên các ô kệ có giao dịch phát sinh lớn hoặc các mặt hàng vừa putaway mới nhập kho để phân công lệnh đếm tự động giúp kiểm tra dòng chảy tồn kho.
                 </p>
               </div>
             ) : (
               /* Manual Assignment Form Inputs */
               <div className="space-y-3.5 border border-muted p-4 rounded-xl bg-muted/20">
                 <div className="space-y-1.5">
                   <Label htmlFor="manual-bin" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                     Mã Vị Trí Ô Kệ (Bin Code) <span className="text-red-500">*</span>
                   </Label>
                   <Input
                     id="manual-bin"
                     placeholder="VD: ST-BABY-03, ST-ELEC-22..."
                     value={manualBin}
                     onChange={(e) => setManualBin(e.target.value)}
                     className="bg-background border-muted h-9 rounded-md text-xs uppercase focus-visible:ring-[#C41E3A]"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <Label htmlFor="manual-sku" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                     Mã SKU Sản Phẩm (Product SKU) <span className="text-red-500">*</span>
                   </Label>
                   <Input
                     id="manual-sku"
                     placeholder="VD: BIMTA-HUG-M, IPHONE15PM..."
                     value={manualSku}
                     onChange={(e) => setManualSku(e.target.value)}
                     className="bg-background border-muted h-9 rounded-md text-xs uppercase focus-visible:ring-[#C41E3A]"
                   />
                 </div>
               </div>
             )}
          </div>

          {/* Dialog Footer Actions */}
          <DialogFooter className="gap-2 pt-2 border-t border-muted/60 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleGenerateCycleCount}
              disabled={isGenerating || (creationMethod === "manual" && (!manualBin.trim() || !manualSku.trim()))}
              className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-extrabold rounded-xl text-xs h-9 shadow-md flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  <ClipboardCheck className="h-4 w-4" />
                  Phát lệnh kiểm kho
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
