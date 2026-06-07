"use client"

import { useEffect, useState } from "react"
import { getPutawayTasks, completePutawayTask } from "@/lib/api/wms-tasks"
import { PutawayTaskDto } from "@/types/wms-tasks"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Badge } from "@repo/ui/components/badge"
import { Input } from "@repo/ui/components/input"
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
  ArchiveRestore,
  Search,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  ClipboardList,
  Loader2,
  PlayCircle,
  PlusCircle,
  LayoutList,
  Boxes,
  FileSpreadsheet,
  CheckCircle
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@repo/ui/components/button"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

export default function PutawayTasksPage() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState<PutawayTaskDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Operator inline inputs state
  const [scannedBins, setScannedBins] = useState<Record<string, string>>({})
  const [completingRow, setCompletingRow] = useState<Record<string, boolean>>({})

  const { activeWarehouseId } = useWarehouseContext()

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await getPutawayTasks(activeWarehouseId || undefined)
      setTasks(data)
    } catch (e: any) {
      toast.error("Không thể tải danh sách tác vụ cất hàng (Putaway)")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [activeWarehouseId])

  const handleComplete = async (taskId: string, suggestedBin: string) => {
    const binToUse = scannedBins[taskId] || suggestedBin
    if (!binToUse || !binToUse.trim()) {
      toast.error("Vui lòng nhập hoặc quét mã Ô kệ đích!")
      return
    }

    try {
      setCompletingRow(prev => ({ ...prev, [taskId]: true }))
      await completePutawayTask(taskId, binToUse.toUpperCase().trim())
      toast.success(`Đã xác nhận cất hàng thành công vào ô kệ ${binToUse.toUpperCase().trim()}!`)
      setScannedBins(prev => {
        const next = { ...prev }
        delete next[taskId]
        return next
      })
      await fetchTasks()
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi hoàn tất cất hàng")
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
            <ArchiveRestore className="h-5 w-5 text-[#C41E3A]" />
            Control Tower: Giám Sát Cất Hàng (Putaway Monitor)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trạm kiểm soát thời gian thực các tác vụ cất hàng của nhân viên từ bến nhận hàng (Staging) vào hệ thống ô kệ lưu kho.
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
                Tổng tác vụ cất hàng
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-foreground">
                {loading ? <Skeleton className="h-8 w-16" /> : totalTasks}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Các tác vụ khởi tạo hôm nay
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chờ thực hiện
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {loading ? <Skeleton className="h-8 w-16" /> : pendingCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Chờ nhân viên kho tiếp nhận
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đang xử lý
              </CardTitle>
              <Clock className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {loading ? <Skeleton className="h-8 w-16" /> : inProgressCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Nhân viên đang quét mã cất kệ
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đã hoàn thành
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {loading ? <Skeleton className="h-8 w-16" /> : completedCount}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Đã cất kệ thành công an toàn
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
            Hiển thị <span className="text-foreground font-bold">{filteredTasks.length}</span> trên tổng số <span className="text-foreground font-bold">{totalTasks}</span> tác vụ cất hàng
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
                  Dòng Di Chuyển (Bins Flow)
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-44">
                  Nhân Viên Kho
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-36 text-center">
                  Thời Gian Tạo
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-32 text-center">
                  Trạng Thái
                </TableHead>
                <TableHead className="text-xs uppercase font-extrabold h-10 tracking-wider text-muted-foreground w-48 text-right">
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
                      <ArchiveRestore className="h-8 w-8 text-muted-foreground/60 stroke-[1.5]" />
                      <p className="font-semibold">Không tìm thấy tác vụ cất hàng nào</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        Hệ thống hiện tại chưa ghi nhận tác vụ Putaway nào khớp với từ khóa tìm kiếm.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => {
                  const sourceBin = task.sourceBinCode || (task as any).sourceBinId || ''
                  const suggestedBin = task.suggestedBinCode || (task as any).suggestedBinId || ''

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
                      <TableCell className="text-xs text-center font-bold">
                        {task.quantity}
                      </TableCell>
                      
                      {/* Bins Flow */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center gap-3">
                          <span className="font-mono text-[10px] font-bold bg-muted px-2 py-0.5 border border-muted/80 rounded text-muted-foreground">
                            {sourceBin}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-indigo-500 animate-pulse shrink-0" />
                          <span className="font-mono text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 border border-indigo-500/20 rounded">
                            {suggestedBin}
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
                            ? "Chờ xử lý"
                            : task.status === "InProgress"
                            ? "Đang thực hiện"
                            : "Đã cất kệ"}
                        </Badge>
                      </TableCell>

                      {/* Operator Actions for Scan & Complete */}
                      <TableCell className="text-right">
                        {task.status === "Pending" || task.status === "InProgress" ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              placeholder="Quét mã Bin thực tế..."
                              className="w-32 h-7 text-[10px] bg-background border-muted px-2 py-1 rounded"
                              value={scannedBins[task.id] || ""}
                              onChange={(e) => setScannedBins(prev => ({ ...prev, [task.id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleComplete(task.id, suggestedBin)}
                              disabled={completingRow[task.id]}
                              className="h-7 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                            >
                              {completingRow[task.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : "Xong"}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 italic font-medium">Hoàn tất</span>
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
