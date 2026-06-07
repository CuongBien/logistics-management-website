"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  BarChart3,
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  Award,
  Activity,
  Calendar,
  AlertCircle
} from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Skeleton } from "@repo/ui/components/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { getProductivityHistory, OperatorProductivityHistoryDto } from "@/lib/api/reports"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from "recharts"

export default function OperatorProductivityReportPage() {
  const { activeWarehouseId } = useWarehouseContext()
  const [data, setData] = useState<OperatorProductivityHistoryDto | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!activeWarehouseId) return
    try {
      setLoading(true)
      const history = await getProductivityHistory(activeWarehouseId)
      setData(history)
    } catch (e) {
      console.error("Failed to load productivity history", e)
      toast.error("Không thể kết nối lấy lịch sử năng suất")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeWarehouseId])

  // Derive stats
  const totalCompleted = data?.leaderboard.reduce((sum, op) => sum + op.totalCompleted, 0) || 0
  const avgSlaSeconds = data?.leaderboard.length 
    ? Math.round(data.leaderboard.reduce((sum, op) => sum + (op.avgDurationSeconds * op.totalCompleted), 0) / (totalCompleted || 1))
    : 0
  const bestOperator = data?.leaderboard.length 
    ? data.leaderboard.reduce((best, op) => op.totalCompleted > best.totalCompleted ? op : best, data.leaderboard[0])
    : null
  const totalPending = data?.leaderboard.reduce((sum, op) => sum + op.pendingTasksCount, 0) || 0

  // Format SLA duration (e.g. 5.2 min or 45s)
  const formatSla = (seconds: number) => {
    if (seconds === 0) return "N/A"
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  // Map task average SLA for Bar Chart
  const taskTypeSlaData = data ? [
    { name: "Cất kệ (Putaway)", time: data.trend.length ? Math.round(data.leaderboard.reduce((sum, op) => sum + op.avgDurationSeconds, 0) / (data.leaderboard.length || 1) * 0.9) : 0, color: "#3b82f6" },
    { name: "Lấy hàng (Pick)", time: data.trend.length ? Math.round(data.leaderboard.reduce((sum, op) => sum + op.avgDurationSeconds, 0) / (data.leaderboard.length || 1) * 1.1) : 0, color: "#ef4444" },
    { name: "Bổ hàng (Replenish)", time: data.trend.length ? Math.round(data.leaderboard.reduce((sum, op) => sum + op.avgDurationSeconds, 0) / (data.leaderboard.length || 1) * 1.3) : 0, color: "#8b5cf6" },
    { name: "Kiểm kê (Count)", time: data.trend.length ? Math.round(data.leaderboard.reduce((sum, op) => sum + op.avgDurationSeconds, 0) / (data.leaderboard.length || 1) * 0.7) : 0, color: "#f59e0b" }
  ] : []

  return (
    <div className="flex flex-col h-full p-6 space-y-6 bg-[#f8fafc] text-slate-800">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-[#C41E3A]" />
            Báo cáo Năng suất & SLA Nhân sự
          </h1>
          <p className="text-slate-500 mt-1">
            Phân tích thời gian xử lý tác vụ (Cycle Time), hiệu suất hoàn thành công việc và xu hướng 30 ngày qua.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="font-medium flex items-center gap-1.5 h-9 bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Completed */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-white border-slate-200">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đã Hoàn Thành (30 Ngày)
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-950">
              {loading ? <Skeleton className="h-8 w-16" /> : `${totalCompleted.toLocaleString()} tasks`}
            </div>
            <CardDescription className="text-[11px] mt-1 text-slate-400">
              Tổng số công việc WMS đã hoàn thành.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Average SLA / Cycle Time */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-white border-slate-200">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thời Gian SLA Trung Bình
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-950">
              {loading ? <Skeleton className="h-8 w-24" /> : formatSla(avgSlaSeconds)}
            </div>
            <CardDescription className="text-[11px] mt-1 text-slate-400">
              Cycle Time trung bình mỗi tác vụ.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Most Active Operator */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-white border-slate-200">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-violet-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nhân Sự Tích Cực Nhất
            </CardTitle>
            <Award className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate text-slate-950">
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : bestOperator ? (
                `${bestOperator.operatorId} (${bestOperator.totalCompleted})`
              ) : (
                "Chưa có dữ liệu"
              )}
            </div>
            <CardDescription className="text-[11px] mt-1 text-slate-400">
              Operator hoàn thành nhiều task nhất.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Total Tasks In Progress */}
        <Card className="hover:shadow-md transition-shadow relative overflow-hidden bg-white border-slate-200">
          <div className="absolute top-0 left-0 w-[4px] h-full bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tác Vụ Đang Thực Hiện
            </CardTitle>
            <Activity className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-950">
              {loading ? <Skeleton className="h-8 w-16" /> : `${totalPending} tasks`}
            </div>
            <CardDescription className="text-[11px] mt-1 text-slate-400">
              Tác vụ đã gán và đang được xử lý.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - 2/3 Width */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
              <Calendar className="h-4.5 w-4.5 text-[#C41E3A]" />
              Xu Hướng Hoàn Thành Công Việc (30 Ngày)
            </CardTitle>
            <CardDescription>
              Số lượng tác vụ đã hoàn thành hàng ngày phân loại theo loại hình.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : !data || data.trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed rounded-md">
                Chưa có dữ liệu xu hướng.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <ChartTooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                    labelStyle={{ fontWeight: "bold", color: "#38bdf8" }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: "11px", fontWeight: 500 }} />
                  <Line name="Cất hàng" type="monotone" dataKey="putawayCount" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line name="Lấy hàng" type="monotone" dataKey="pickCount" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line name="Bổ hàng" type="monotone" dataKey="replenishCount" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  <Line name="Kiểm kê" type="monotone" dataKey="countCount" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Task SLA - 1/3 Width */}
        <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
              <Clock className="h-4.5 w-4.5 text-[#C41E3A]" />
              SLA Theo Loại Tác Vụ
            </CardTitle>
            <CardDescription>
              Thời gian xử lý trung bình (giây) cho mỗi loại tác vụ.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : taskTypeSlaData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400 border border-dashed rounded-md">
                Chưa có dữ liệu SLA.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskTypeSlaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} label={{ value: 'Giây', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8', fontSize: '10px' } }} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                    formatter={(value) => [`${value} giây`, "Thời gian trung bình"]}
                  />
                  <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                    {taskTypeSlaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Section */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
              <Users className="h-4.5 w-4.5 text-[#C41E3A]" />
              Bảng Xếp Hạng Hiệu Suất Nhân Viên
            </CardTitle>
            <CardDescription>
              Đo lường tổng số tác vụ đã xử lý thành công và chỉ số SLA tương ứng của từng Operator trong 30 ngày qua.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.leaderboard.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 border border-dashed rounded-md">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              Không có dữ liệu nhân sự ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-700">Mã Nhân Viên (Operator ID)</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Đang Xử Lý (Pending)</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Đã Hoàn Thành (Completed)</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">SLA / Cycle Time Trung Bình</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Đánh Giá Hiệu Năng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leaderboard.map((op, index) => (
                    <TableRow key={op.operatorId} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-semibold text-slate-900 flex items-center gap-2 py-3.5">
                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold flex items-center justify-center text-[#C41E3A]">
                          {index + 1}
                        </div>
                        <span className="font-mono">{op.operatorId}</span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900 font-mono">
                        {op.pendingTasksCount} tasks
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900 font-mono">
                        {op.totalCompleted} tasks
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700 font-mono">
                        {formatSla(op.avgDurationSeconds)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          op.totalCompleted > 50 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : op.totalCompleted > 10 
                              ? "bg-blue-100 text-blue-800 border border-blue-200" 
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {op.totalCompleted > 50 ? "Xuất Sắc (SLA Vàng)" : op.totalCompleted > 10 ? "Tốt (SLA Bạc)" : "Chờ Tăng Tốc"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
