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

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState("")
  const [currentDate, setCurrentDate] = useState("")

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

  // Mock Space Utilization data
  const zoneUtilization = [
    { zone: "Khu vực A (Fast Moving)", code: "Zone-A", occupied: 89, total: 1200, color: "bg-emerald-500" },
    { zone: "Khu vực B (Electronics)", code: "Zone-B", occupied: 72, total: 800, color: "bg-blue-500" },
    { zone: "Khu vực C (Fragile Items)", code: "Zone-C", occupied: 45, total: 500, color: "bg-amber-500" },
    { zone: "Khu vực D (Cold Storage)", code: "Zone-D", occupied: 94, total: 300, color: "bg-red-500" },
  ]

  // Mock Top SKUs
  const topSKUs = [
    { sku: "IPHONE15PM", name: "iPhone 15 Pro Max 256GB", count: 1840, val: "46.0B VND", status: "Tồn tối ưu" },
    { sku: "BIMTA-HUG-M", name: "Bỉm Huggies Size M", count: 1420, val: "1.2B VND", status: "Cần châm hàng" },
    { sku: "DAUAN-SIMPLY-1L", name: "Dầu ăn Simply 1 Lít", count: 1105, val: "620M VND", status: "Tồn cao" },
    { sku: "SARA-LE-BREAD", name: "Bánh mì Sara Lee", count: 980, val: "380M VND", status: "Tồn tối ưu" },
    { sku: "LG-OLED-65", name: "Smart TV LG OLED 65 inch", count: 750, val: "18.7B VND", status: "Tồn tối ưu" },
  ]

  // Mock Worker Productivity
  const teamProductivity = [
    { name: "Nguyễn Văn Khoa", role: "Nhân viên Cất hàng", completed: 184, rate: 98.5, status: "Xuất sắc" },
    { name: "Trần Thị Vân", role: "Nhân viên Kiểm kê", completed: 152, rate: 99.2, status: "Xuất sắc" },
    { name: "Lê Văn Nam", role: "Nhân viên Châm hàng", completed: 148, rate: 97.8, status: "Tốt" },
    { name: "Phạm Minh Hoàng", role: "Nhân viên Soạn hàng", completed: 135, rate: 94.5, status: "Đạt" },
  ]

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
            Kho: ATL-01 (Miền Nam)
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
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Độ chính xác nhặt hàng</span>
              <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center">
                <PackageCheck className="h-4.5 w-4.5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">99.85%</h3>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +0.15% so với mục tiêu (99.5%)
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
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">82.4%</h3>
              <p className="text-[11px] text-[#C41E3A] font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +2.3% sức chứa kệ đã sử dụng
              </p>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white border-l-4 border-blue-500 rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Vòng quay tồn kho</span>
              <div className="h-8 w-8 bg-blue-50 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">14.2 vòng</h3>
              <p className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3.5 w-3.5" />
                +1.4 vòng/năm (Tốc độ tối ưu)
              </p>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white border-l-4 border-amber-500 rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Tỉ lệ hoàn hàng (RTO)</span>
              <div className="h-8 w-8 bg-amber-50 rounded-full flex items-center justify-center">
                <Percent className="h-4.5 w-4.5 text-amber-600" />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">1.12%</h3>
              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowDownRight className="h-3.5 w-3.5" />
                -0.45% so với tháng trước
              </p>
            </div>
          </div>

        </div>

        {/* Complex Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Warehouse Space utilization Details */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Sử dụng không gian khu vực</h3>
              <Warehouse className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="p-4 space-y-4">
              {zoneUtilization.map((z) => (
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
                    <span>Sức chứa: {z.total} SKU</span>
                    <span>Tình trạng: {z.occupied > 90 ? "Quá tải" : z.occupied > 70 ? "Tối ưu" : "Còn trống rộng"}</span>
                  </div>
                </div>
              ))}
              
              <div className="bg-[#C41E3A]/5 border border-[#C41E3A]/10 rounded p-3 text-xs mt-2 text-[#A01830] leading-relaxed">
                <h4 className="font-bold flex items-center gap-1.5 text-[#C41E3A] mb-1">
                  <Percent className="h-3.5 w-3.5 shrink-0" />
                  Khuyến nghị điều phối không gian:
                </h4>
                Khu vực <strong>Cold Storage (Zone-D)</strong> đang ở mức cảnh báo nghiêm trọng (94%). Hãy ưu tiên xuất hàng hoặc chuyển dời một số lô bánh ngọt sang khu vực phụ để giảm tải.
              </div>
            </div>
          </div>

          {/* Top Value and Performing SKUs */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Hàng hóa chu kỳ cao & Giá trị lớn</h3>
              <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-slate-100/50 text-slate-400 font-bold border-b border-slate-200">
                    <th className="p-3 font-semibold uppercase tracking-wider">Mã SKU</th>
                    <th className="p-3 font-semibold uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="p-3 font-semibold uppercase tracking-wider text-center">Tần suất nhặt</th>
                    <th className="p-3 font-semibold uppercase tracking-wider text-right">Giá trị kho ước tính</th>
                    <th className="p-3 font-semibold uppercase tracking-wider text-center">Trạng thái định mức</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {topSKUs.map((s) => (
                    <tr key={s.sku} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#C41E3A]">{s.sku}</td>
                      <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                      <td className="p-3 text-center text-slate-900 font-bold font-mono">{s.count.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">{s.val}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.status === "Tồn tối ưu" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                            : s.status === "Cần châm hàng" 
                              ? "bg-red-50 text-[#C41E3A] border border-red-100 animate-pulse" 
                              : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Worker Leaderboard and Productivity Panel */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider">Hiệu suất Đội ngũ Nhân viên kho (WMS Leaderboard)</h3>
            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-slate-100/50 text-slate-400 font-bold border-b border-slate-200">
                  <th className="p-3 font-semibold uppercase tracking-wider">Tên nhân viên</th>
                  <th className="p-3 font-semibold uppercase tracking-wider">Vai trò phân bổ</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Số tác vụ đã hoàn thành</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Tỉ lệ chính xác thao tác</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-center">Đánh giá tháng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {teamProductivity.map((w) => (
                  <tr key={w.name} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold flex items-center justify-center text-slate-600">
                        {w.name.split(" ").slice(-1)[0][0]}
                      </div>
                      {w.name}
                    </td>
                    <td className="p-3 text-slate-500 font-normal">{w.role}</td>
                    <td className="p-3 text-center text-slate-900 font-bold font-mono">{w.completed} tasks</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">{w.rate}%</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        w.status === "Xuất sắc" 
                          ? "bg-emerald-500 text-white" 
                          : w.status === "Tốt" 
                            ? "bg-blue-500 text-white" 
                            : "bg-slate-500 text-white"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
