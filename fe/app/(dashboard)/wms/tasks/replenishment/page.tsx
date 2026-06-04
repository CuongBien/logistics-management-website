"use client"

import { useEffect, useState } from "react"
import { getReplenishmentTasks, generateReplenishment, completeReplenishmentTask } from "@/lib/api/wms-tasks"
import { ReplenishmentTaskDto } from "@/types/wms-tasks"
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
  RefreshCcw,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Loader2,
  Workflow
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function ReplenishmentTasksPage() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState<ReplenishmentTaskDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isTriggering, setIsTriggering] = useState(false)
  const [completingRow, setCompletingRow] = useState<Record<string, boolean>>({})

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await getReplenishmentTasks()
      setTasks(data)
    } catch (e: any) {
      toast.error("Không thể tải danh sách tác vụ châm hàng (Replenishment)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleRunAlgorithm = async () => {
    try {
      setIsTriggering(true)
      const updatedList = await generateReplenishment()
      setTasks(updatedList)
      toast.success("Kích hoạt thuật toán bổ sung hàng thành công! Đã tự động sinh tác vụ châm hàng mới.")
    } catch (e: any) {
      toast.error(e.message || "Kích hoạt thuật toán châm hàng thất bại")
    } finally {
      setIsTriggering(false)
    }
  }

  const handleComplete = async (taskId: string) => {
    try {
      setCompletingRow(prev => ({ ...prev, [taskId]: true }))
      await completeReplenishmentTask(taskId)
      toast.success("Đã hoàn tất tác vụ châm hàng!")
      await fetchTasks()
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi hoàn tất châm hàng")
    } finally {
      setCompletingRow(prev => ({ ...prev, [taskId]: false }))
    }
  }

  // Client-side search filtering by SKU or Task ID
  const filteredTasks = tasks.filter(
    (task) =>
      task.sku.toLowerCase().includes(search.toLowerCase()) ||
      task.id.toLowerCase().includes(search.toLowerCase())
  )

  // Compute metrics
  const totalTasks = tasks.length
  const pendingCount = tasks.filter((t) => t.status === "Pending").length
  const inProgressCount = tasks.filter((t) => t.status === "InProgress").length
  const completedCount = tasks.filter((t) => t.status === "Completed").length

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header bar */}
      <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
            <Workflow className="h-5 w-5 text-[#C41E3A]" />
            Control Tower: Giám Sát Châm Hàng (Replenishment Control)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phát lệnh châm hàng tự động và giám sát di chuyển tồn kho bổ sung từ khu trữ sâu (Deep Storage) ra kệ nhặt lẻ (Picking Bin).
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
        
        {/* Run Replenishment Algorithm Panel Card */}
        <Card className="border border-muted/80 shadow-md relative overflow-hidden bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white rounded-xl">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#C41E3A]" />
          <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white/90 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-[#C41E3A] animate-pulse" />
                Hệ Thống Tự Động Bổ Sung Hàng Hóa (Auto-Replenishment System)
              </h3>
              <p className="text-[11px] text-white/70 max-w-2xl leading-relaxed">
                Khi kích hoạt, hệ toán sẽ quét toàn bộ các kệ chứa nhặt hàng hoạt động (`Active Picking Bins`). Nếu lượng tồn kho thực tế giảm dưới ngưỡng tồn an toàn tối thiểu (`Min Threshold`), hệ thống tự động sinh lệnh châm hàng khẩn cấp di chuyển từ ô kệ trữ hàng sâu (`Deep Storage`).
              </p>
            </div>
            
            <Button
              onClick={handleRunAlgorithm}
              disabled={isTriggering}
              className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-extrabold text-xs h-10 px-5 rounded-md shadow-lg shadow-[#C41E3A]/25 border-none transition-all duration-300 shrink-0 self-start md:self-center"
            >
              {isTriggering ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang chạy thuật toán...
                </>
              ) : (
                <>
                  <Cpu className="h-4 w-4 mr-2" />
                  Kích hoạt Thuật Toán Bổ Sung
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổng tác vụ châm hàng
              </CardTitle>
              <Workflow className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-foreground">
                {loading ? <Skeleton className="h-8 w-16" /> : totalTasks}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Các tác vụ bổ sung kho hôm nay
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đang chờ châm
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {loading ? <Skeleton className="h-8 w-16" /> : pendingCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Đang nằm trong hàng đợi tác vụ
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đang vận chuyển châm
              </CardTitle>
              <Clock className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {loading ? <Skeleton className="h-8 w-16" /> : inProgressCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Nhân viên đang đẩy xe chuyển hàng
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đã bổ sung xong
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? <Skeleton className="h-8 w-16" /> : completedCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Picking Bins đã đầy đủ tồn kho
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-card border border-muted rounded-xl p-4 flex gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo mã SKU hoặc Mã Tác Vụ..."
              className="pl-9 h-9 rounded-md text-xs bg-background border-muted"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-[10px] text-muted-foreground font-medium">
            Hiển thị <span className="text-foreground font-bold">{filteredTasks.length}</span> trên tổng số <span className="text-foreground font-bold">{totalTasks}</span> tác vụ châm hàng
          </p>
        </div>

        {/* DataTable Monitor */}
        <div className="border border-muted bg-card rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b border-muted">
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36">
                  Mã Tác Vụ
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-40">
                  Mã SKU Sản Phẩm
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-24 text-center">
                  Số Lượng
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground text-center">
                  Dòng Di Chuyển Châm Hàng (Bins Flow)
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-44">
                  Nhân Viên Phân Bổ
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36 text-center">
                  Thời Gian Tạo
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-28 text-center">
                  Trạng Thái
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36 text-right">
                  Thao Tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <TableRow key={idx} className="border-b border-muted">
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-44 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                    <div className="flex flex-col items-center gap-2">
                      <Workflow className="h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
                      <p className="font-semibold">Không tìm thấy tác vụ châm hàng nào</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        Kích hoạt thuật toán tự động bổ sung hàng ở trên để sinh tác vụ châm hàng tức thời.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const fromBin = task.fromBinCode || (task as any).fromBinId || ''
                  const toBin = task.toBinCode || (task as any).toBinId || ''

                  return (
                    <TableRow key={task.id} className="hover:bg-muted/10 border-b border-muted transition-colors">
                      {/* Task ID */}
                      <TableCell className="text-xs font-bold font-mono text-[#C41E3A] tracking-wider uppercase">
                        {task.id}
                      </TableCell>
                      
                      {/* SKU Code */}
                      <TableCell className="text-xs font-bold font-mono text-foreground uppercase">
                        {task.sku}
                      </TableCell>
                      
                      {/* Qty */}
                      <TableCell className="text-xs text-center font-black text-[#C41E3A]">
                        {task.quantity}
                      </TableCell>
                      
                      {/* Bins Flow */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center gap-3">
                          <span className="font-mono text-[10px] font-bold bg-muted px-2 py-0.5 border border-muted/80 rounded text-muted-foreground">
                            {fromBin}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                          <span className="font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 border border-indigo-500/20 rounded">
                            {toBin}
                          </span>
                        </div>
                      </TableCell>
                      
                      {/* Operator */}
                      <TableCell className="text-xs font-semibold text-foreground">
                        {task.operatorName || (
                          <span className="text-muted-foreground font-normal italic text-[11px]">Chưa phân bổ</span>
                        )}
                      </TableCell>
                      
                      {/* Created Date */}
                      <TableCell className="text-xs text-center font-mono text-muted-foreground">
                        {new Date(task.createdAt).toLocaleString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit"
                        })}
                      </TableCell>
                      
                      {/* Status Badge */}
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.status === "Pending"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : task.status === "InProgress"
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              task.status === "Pending"
                                ? "bg-amber-500 animate-pulse"
                                : task.status === "InProgress"
                                ? "bg-indigo-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          {task.status === "Pending"
                            ? "Chờ châm"
                            : task.status === "InProgress"
                            ? "Đang châm hàng"
                            : "Đã hoàn thành"}
                        </Badge>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="text-right">
                        {task.status === "Pending" || task.status === "InProgress" ? (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(task.id)}
                            disabled={completingRow[task.id]}
                            className="h-7 text-[10px] px-3.5 bg-[#C41E3A] hover:bg-[#A01830] text-white rounded font-bold shadow-sm"
                          >
                            {completingRow[task.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Hoàn tất"}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 italic font-medium">Hoàn thành</span>
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
    </div>
  )
}
