"use client"

import { useState, useEffect } from "react"
import { CrossDockTaskDto } from "@/types/wms-crossdock"
import { getCrossDockTasks } from "@/lib/api/wms-crossdock"
import { CrossDockDataGrid } from "@/components/wms/crossdock/CrossDockDataGrid"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, RefreshCw, Layers, Clock, CheckCircle2, GitMerge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function CrossDockMonitoringPage() {
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
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Giám Sát Luân Chuyển Thẳng (Cross-Docking Control Tower)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Trạm giám sát luân chuyển nhanh: Theo dõi các tác vụ chuyển hàng trực tiếp từ khu vực Nhận (Inbound) sang khu vực Xuất (Outbound) không qua lưu kho.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTasks}
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics analytical widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Tasks */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card border-muted shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tổng tác vụ Cross-Dock
            </CardTitle>
            <GitMerge className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalTasks}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Toàn bộ các yêu cầu luân chuyển thẳng trong ngày.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card border-muted shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Đang Chờ Luân Chuyển
            </CardTitle>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : pendingTasks}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Sản phẩm diện Cross-dock đang chờ bốc xếp di chuyển.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card border-muted shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Hoàn Thành Luân Chuyển
            </CardTitle>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : completedTasks}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Các kiện hàng đã cất thành công tại kệ Staging Outbound.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: DataGrid Monitoring Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <CrossDockDataGrid tasks={tasks} />
      )}
    </div>
  )
}
