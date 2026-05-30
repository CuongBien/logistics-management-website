"use client"

import { useEffect, useState } from "react"
import { getCycleCountTasks, generateCycleCount } from "@/lib/api/wms-tasks"
import { CycleCountTaskDto } from "@/types/wms-tasks"
import { AdjustmentApprovalDialog } from "@/components/wms/tasks/AdjustmentApprovalDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
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

export default function CycleCountTasksPage() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState<CycleCountTaskDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Generating state
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Approval dialog state
  const [selectedTask, setSelectedTask] = useState<CycleCountTaskDto | null>(null)
  const [isApprovalOpen, setIsApprovalOpen] = useState(false)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await getCycleCountTasks()
      setTasks(data)
    } catch (e: any) {
      toast.error("Không thể tải danh sách tác vụ kiểm kê (Cycle Count)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleGenerateCycleCount = async () => {
    try {
      setIsGenerating(true)
      // Call mock API generating task for diapers in ST-BABY-03
      const generated = await generateCycleCount("ST-BABY-03", "BIMTA-HUG-M")
      toast.success(`Đã tự động khởi tạo thành công phiên kiểm kho mới ${generated.id} tại ô kệ ST-BABY-03!`)
      await fetchTasks()
    } catch (e: any) {
      toast.error(e.message || "Tạo lệnh kiểm kho thất bại")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenApproval = (task: CycleCountTaskDto) => {
    setSelectedTask(task)
    setIsApprovalOpen(true)
  }

  // Client-side search filtering by SKU or Task ID or Bin Code
  const filteredTasks = tasks.filter(
    (task) =>
      task.sku.toLowerCase().includes(search.toLowerCase()) ||
      task.id.toLowerCase().includes(search.toLowerCase()) ||
      task.binCode.toLowerCase().includes(search.toLowerCase())
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
            onClick={handleGenerateCycleCount}
            disabled={isGenerating}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-extrabold text-xs h-9 px-4 rounded-md shadow-sm w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Đang tạo lệnh đếm...
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5 mr-1.5" />
                Tạo Lệnh Đếm Kho (Auto-generate)
              </>
            )}
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
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-center">
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
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-right">
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
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
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
                  const hasDiscrepancy = counted !== undefined && expected !== counted
                  const diff = counted !== undefined ? counted - expected : null

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
                        {task.binCode}
                      </TableCell>
                      
                      {/* SKU Code */}
                      <TableCell className="text-xs font-bold font-mono text-foreground uppercase">
                        {task.sku}
                      </TableCell>
                      
                      {/* Expected Qty */}
                      <TableCell className="text-xs text-center font-semibold font-mono text-muted-foreground">
                        {expected}
                      </TableCell>
                      
                      {/* Counted Qty */}
                      <TableCell className={`text-xs text-center font-bold font-mono ${
                        counted !== undefined ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground/50"
                      }`}>
                        {counted !== undefined ? counted : "—"}
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
                          <span className="text-[10px] text-muted-foreground/80 font-bold font-mono text-[9px] uppercase tracking-wide">
                            LỊCH SỬ DUYỆT
                          </span>
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
    </div>
  )
}
