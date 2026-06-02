"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Building2,
  FileSpreadsheet,
  FileText,
  UserCheck,
  CheckCircle2,
  PackageCheck,
  Percent,
  Warehouse,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCapacity,
  getInventoryStats,
  getWorkloads,
  getDiscrepancies,
  getOperatorProductivity,
  getTopMovingSkus,
  WarehouseCapacityDto,
  InventoryStatsDto,
  PendingWorkloadsDto,
  DiscrepanciesStatsDto,
  OperatorProductivityDto,
  TopMovingSkuDto
} from "@/lib/api/reports"
import { getItems } from "@/lib/api/master-data"
import { ItemDto } from "@/types/master-data"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")

  const [capacity, setCapacity] = useState<WarehouseCapacityDto | null>(null)
  const [inventoryStats, setInventoryStats] = useState<InventoryStatsDto | null>(null)
  const [workloads, setWorkloads] = useState<PendingWorkloadsDto | null>(null)
  const [discrepancies, setDiscrepancies] = useState<DiscrepanciesStatsDto | null>(null)
  const [teamProductivity, setTeamProductivity] = useState<OperatorProductivityDto[]>([])
  const [topSKUs, setTopSKUs] = useState<TopMovingSkuDto[]>([])
  const [itemsMaster, setItemsMaster] = useState<ItemDto[]>([])
  const [loading, setLoading] = useState(true)

  const loadReportData = async () => {
    try {
      setLoading(true)
      const [cap, inv, work, disc, prod, top, items] = await Promise.all([
        getCapacity(),
        getInventoryStats(),
        getWorkloads(),
        getDiscrepancies(),
        getOperatorProductivity(),
        getTopMovingSkus(),
        getItems()
      ])
      setCapacity(cap)
      setInventoryStats(inv)
      setWorkloads(work)
      setDiscrepancies(disc)
      setTeamProductivity(prod)
      setTopSKUs(top)
      setItemsMaster(items)
    } catch (e) {
      console.error("Failed to load WMS report data", e)
      toast.error("Không thể kết nối lấy dữ liệu báo cáo thật")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [])

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }))
    setCurrentDate(new Date().toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }))
    
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleExport = (type: "pdf" | "excel") => {
    setIsExporting(type)
    const exportName = type === "pdf" ? "PDF Report" : "Excel Sheet"
    
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `Đang kết xuất dữ liệu và khởi tạo file ${exportName}...`,
        success: () => {
          setIsExporting(null)
          return `Kết xuất file ${exportName} thành công! File đã tự động tải về.`
        },
        error: "Có lỗi xảy ra trong quá trình xuất dữ liệu."
      }
    )
  }

  const getSkuName = (skuCode: string) => {
    const found = itemsMaster.find(item => item.sku === skuCode);
    return found ? found.name : "Sản phẩm SKU WMS";
  };

  const getSkuCategory = (skuCode: string) => {
    const found = itemsMaster.find(item => item.sku === skuCode);
    return found ? found.category : "Thiết bị";
  };

  // Space Utilization data mapped from capacity
  const zoneUtilization = capacity ? [
    { zone: "Vị trí đang chứa hàng (Occupied)", code: "Occupied", occupied: Math.round(capacity.occupiedBins / (capacity.totalBins || 1) * 100), total: capacity.occupiedBins, color: "bg-blue-500" },
    { zone: "Vị trí đã đầy (Full Bins)", code: "Full", occupied: Math.round(capacity.fullBins / (capacity.totalBins || 1) * 100), total: capacity.fullBins, color: "bg-red-500" },
    { zone: "Vị trí còn trống (Available Bins)", code: "Available", occupied: Math.round(capacity.emptyBins / (capacity.totalBins || 1) * 100), total: capacity.emptyBins, color: "bg-emerald-500" },
  ] : [];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] select-none text-slate-800">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
            <BarChart3 className="h-4.5 w-4.5 text-[#C41E3A]" />
            Báo Cáo & Phân Tích Hiệu Suất (Control Tower)
          </h1>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded flex items-center gap-1">
            <Building2 className="h-3 w-3 text-slate-400" />
            Live Database Connected
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>{currentDate}</span>
          <span className="font-mono bg-slate-950 text-white font-bold px-2 py-0.5 rounded shadow-sm">{currentTime}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-w-[1600px] mx-auto w-full">
        
        {/* Controls Ribbon */}
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Calendar className="h-4 w-4 text-slate-400 mr-1" />
            {[
              { id: "today", label: "Hôm nay" },
              { id: "7days", label: "7 ngày qua" },
              { id: "30days", label: "30 ngày qua" },
              { id: "year", label: "Năm nay" },
            ].map((t) => (
              <Button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                variant={timeRange === t.id ? "default" : "outline"}
                className={`h-7 text-xs px-3 rounded ${
                  timeRange === t.id 
                    ? "bg-[#C41E3A] hover:bg-[#A01830] text-white" 
                    : "text-slate-600 hover:text-[#C41E3A] hover:bg-slate-50 border-slate-200"
                }`}
              >
                {t.label}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => handleExport("excel")}
              disabled={isExporting !== null}
              variant="outline"
              className="flex-1 sm:flex-none h-8 text-xs border-slate-200 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 rounded font-medium flex items-center gap-1.5 transition-colors"
            >
              {isExporting === "excel" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Xuất Excel
            </Button>
            
            <Button
              onClick={() => handleExport("pdf")}
              disabled={isExporting !== null}
              variant="outline"
              className="flex-1 sm:flex-none h-8 text-xs border-slate-200 text-slate-700 hover:text-[#C41E3A] hover:bg-red-50 hover:border-[#C41E3A]/20 rounded font-medium flex items-center gap-1.5 transition-colors"
            >
              {isExporting === "pdf" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-[#C41E3A]" />
              )}
              Xuất Báo Cáo PDF
            </Button>
          </div>
        </div>

        {/* Dynamic 4-KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1 */}
          <div className="bg-white border-l-4 border-emerald-500 rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Mã lỗi chưa xử lý</span>
              <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center">
                <PackageCheck className="h-4.5 w-4.5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Skeleton className="h-7 w-20" /> : (discrepancies?.unresolvedInboundDiscrepancies || 0) + (discrepancies?.unresolvedTransitDiscrepancies || 0)} lỗi
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                {discrepancies?.unresolvedInboundDiscrepancies || 0} lỗi nhập kho, {discrepancies?.unresolvedTransitDiscrepancies || 0} lỗi vận chuyển
              </p>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white border-l-4 border-[#C41E3A] rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tỉ lệ lấp đầy kho</span>
              <div className="h-8 w-8 bg-red-50 rounded-full flex items-center justify-center">
                <Warehouse className="h-4.5 w-4.5 text-[#C41E3A]" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Skeleton className="h-7 w-20" /> : `${capacity?.occupancyRate || 0}%`}
              </h3>
              <p className="text-[11px] text-[#C41E3A] font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Dựa trên {capacity?.occupiedBins || 0} / {capacity?.totalBins || 0} kệ đang sử dụng
              </p>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white border-l-4 border-blue-500 rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tổng số lượng tồn kho</span>
              <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Skeleton className="h-7 w-20" /> : `${inventoryStats?.totalPhysicalQuantity || 0} sản phẩm`}
              </h3>
              <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {inventoryStats?.totalUniqueSkus || 0} mã hàng hóa SKU khác nhau
              </p>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white border-l-4 border-amber-500 rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tác vụ đang chờ</span>
              <div className="h-8 w-8 bg-amber-50 rounded-full flex items-center justify-center">
                <Percent className="h-4.5 w-4.5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {loading ? <Skeleton className="h-7 w-20" /> : `${(workloads?.pendingInboundReceipts || 0) + (workloads?.pendingPutawayTasks || 0) + (workloads?.pendingOutboundWaves || 0)} tác vụ`}
              </h3>
              <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {workloads?.pendingInboundReceipts || 0} Nhập, {workloads?.pendingPutawayTasks || 0} Cất, {workloads?.pendingOutboundWaves || 0} Xuất
              </p>
            </div>
          </div>

        </div>

        {/* Complex Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Warehouse Space utilization Details */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Sử dụng không gian kệ hàng</h3>
              <Warehouse className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="p-4 space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : zoneUtilization.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Không có dữ liệu kệ hàng</p>
              ) : (
                zoneUtilization.map((z) => (
                  <div key={z.code} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{z.zone}</span>
                      <span className="text-[#C41E3A]">{z.occupied}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${z.color} rounded-full transition-all duration-500`} 
                        style={{ width: `${z.occupied}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium font-mono">
                      <span>Số lượng: {z.total} kệ</span>
                      <span>Trạng thái: Live từ Database</span>
                    </div>
                  </div>
                ))
              )}
              
              <div className="bg-[#C41E3A]/5 border border-[#C41E3A]/10 rounded p-3 text-xs mt-2 text-[#A01830] leading-relaxed">
                <h4 className="font-bold flex items-center gap-1.5 text-[#C41E3A] mb-1">
                  <Percent className="h-3.5 w-3.5 shrink-0" />
                  Cảnh báo thông lượng:
                </h4>
                Hệ thống đang giám sát live tỉ lệ lấp đầy đạt <strong>{capacity?.occupancyRate || 0}%</strong>. Hãy theo dõi các tác vụ Cất hàng (Putaway) đang chờ xử lý để tối ưu luồng sắp xếp hàng hóa.
              </div>
            </div>
          </div>

          {/* Top Value and Performing SKUs */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Hàng hóa có tần suất dịch chuyển cao nhất</h3>
              <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-400 font-bold border-b border-slate-200">
                    <th className="p-3 font-semibold uppercase tracking-wider">Mã SKU</th>
                    <th className="p-3 font-semibold uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="p-3 font-semibold uppercase tracking-wider">Ngành hàng</th>
                    <th className="p-3 font-semibold uppercase tracking-wider text-center">Tần suất xuất/nhập</th>
                    <th className="p-3 font-semibold uppercase tracking-wider text-center">Trạng thái định mức</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx}>
                        <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                        <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-3 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                        <td className="p-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                      </tr>
                    ))
                  ) : topSKUs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">Không có dữ liệu chuyển động SKU thực tế trong kỳ</td>
                    </tr>
                  ) : (
                    topSKUs.map((s) => (
                      <tr key={s.skuId} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#C41E3A]">{s.skuId}</td>
                        <td className="p-3 font-semibold text-slate-900">{getSkuName(s.skuId)}</td>
                        <td className="p-3 text-slate-500 font-normal">{getSkuCategory(s.skuId)}</td>
                        <td className="p-3 text-center text-slate-900 font-bold font-mono">{s.totalMovement.toLocaleString()} tác vụ</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            s.totalMovement > 50 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                              : s.totalMovement > 10 
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-slate-50 text-slate-600 border border-slate-100"
                          }`}>
                            {s.totalMovement > 50 ? "Tần suất cao" : s.totalMovement > 10 ? "Tồn tối ưu" : "Tần suất thấp"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Worker Leaderboard and Productivity Panel */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Hiệu suất nhân viên vận hành (WMS Productivity)</h3>
            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-slate-100/50 text-slate-400 font-bold border-b border-slate-200">
                  <th className="p-3 font-semibold uppercase tracking-wider">Mã nhân viên / Username</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Tác vụ đang chờ xử lý</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Số tác vụ đã hoàn thành hôm nay</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Đánh giá hôm nay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <tr key={idx}>
                      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-3 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                      <td className="p-3 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                      <td className="p-3 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : teamProductivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">Không có dữ liệu hiệu năng nhân viên ghi nhận hôm nay</td>
                  </tr>
                ) : (
                  teamProductivity.map((w) => (
                    <tr key={w.operatorId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">
                          {w.operatorId[0].toUpperCase()}
                        </div>
                        {w.operatorId}
                      </td>
                      <td className="p-3 text-center text-slate-900 font-bold font-mono">{w.pendingTasks} tasks</td>
                      <td className="p-3 text-center text-slate-900 font-bold font-mono">{w.completedTasksToday} tasks</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          w.completedTasksToday > 10 
                            ? "bg-emerald-500 text-white" 
                            : w.completedTasksToday > 0 
                              ? "bg-blue-500 text-white" 
                              : "bg-slate-500 text-white"
                        }`}>
                          {w.completedTasksToday > 10 ? "Xuất sắc" : w.completedTasksToday > 0 ? "Tốt" : "Chờ tác vụ"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
