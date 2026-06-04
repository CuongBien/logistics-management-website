"use client"

import { useState, useEffect } from "react"
import { CrossDockTaskDto } from "@/types/wms-crossdock"
import { getCrossDockTasks } from "@/lib/api/wms-crossdock"
import { CrossDockDataGrid } from "@/components/wms/crossdock/CrossDockDataGrid"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, RefreshCw, GitMerge, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function CrossDockMonitoringPage() {
  const pathname = usePathname()
  const [tasks, setTasks] = useState<CrossDockTaskDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks
  const fetchTasks = async () => {
    setIsLoading(true)
    try {
      const data = await getCrossDockTasks()
      setTasks(data)
    } catch (error) {
      toast.error("Lỗi khi tải danh sách tác vụ Cross-Docking")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // KPI Calculations
  const totalTasks = tasks.length
  const pendingTasks = tasks.filter(t => t.status === "Pending").length
  const completedTasks = tasks.filter(t => t.status === "Completed").length

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page Title & Main Header */}
      <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 text-foreground tracking-tight">
            <GitMerge className="h-5 w-5 text-[#C41E3A]" />
            Control Tower: Giám Sát Luân Chuyển Thẳng (Cross-Docking Monitor)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trạm giám sát luân chuyển nhanh: Theo dõi các tác vụ chuyển hàng trực tiếp từ khu vực Nhận (Inbound) sang khu vực Xuất (Outbound) không qua lưu kho.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isLoading}
            className="h-9 text-xs rounded-md border-muted text-muted-foreground hover:text-foreground bg-card shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
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
            className={`transition-colors hover:text-foreground relative ${
              pathname === "/wms/tasks/cross-dock"
                ? "text-[#C41E3A] after:absolute after:bottom-[-11px] after:left-0 after:w-full after:h-[2px] after:bg-[#C41E3A]"
                : ""
            }`}
          >
            Luân Chuyển Thẳng (Cross-Dock)
          </Link>
        </div>
      </div>

      <div className="px-6 space-y-4 flex-1 overflow-y-auto pb-6">
        {/* Row 1: KPI Statistics analytical widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Tasks */}
          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tổng tác vụ Cross-Dock
              </CardTitle>
              <GitMerge className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-foreground">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalTasks}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Các yêu cầu luân chuyển trong ngày
              </p>
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Đang Chờ Luân Chuyển
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {isLoading ? <Skeleton className="h-8 w-16" /> : pendingTasks}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Sản phẩm chờ xếp dỡ di chuyển
              </p>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card className="bg-card border border-muted/80 shadow-sm relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Hoàn Thành Luân Chuyển
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-1 px-4 pb-3.5">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {isLoading ? <Skeleton className="h-8 w-16" /> : completedTasks}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Kiện hàng đã xuất tại cổng Outbound
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: DataGrid Monitoring Table */}
        {isLoading ? (
          <div className="border border-muted bg-card rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
            <p className="text-xs text-muted-foreground">Đang tải dữ liệu tác vụ Cross-Docking...</p>
          </div>
        ) : (
          <div className="border border-muted bg-card rounded-xl shadow-sm overflow-hidden">
            <CrossDockDataGrid tasks={tasks} />
          </div>
        )}
      </div>
    </div>
  )
}
