"use client"

import { useState, useEffect } from "react"
import { Server, RefreshCw, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { toast } from "sonner"
import { getSyncCheckpoints, triggerSync, SyncCheckpointDto } from "@/lib/api/wms-system"

export default function SystemSyncPage() {
  const [checkpoints, setCheckpoints] = useState<SyncCheckpointDto[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadCheckpoints = async () => {
    try {
      setLoading(true)
      const data = await getSyncCheckpoints()
      setCheckpoints(data)
    } catch (e) {
      console.error(e)
      toast.error("Không thể kết nối lấy thông tin Checkpoints đồng bộ")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCheckpoints()
  }, [])

  const handleTriggerSync = async () => {
    try {
      setSyncing(true)
      const res = await triggerSync()
      toast.success(res?.message || "Đã phát lệnh kích hoạt đồng bộ ERP ngầm thành công!")
      // Reload checkpoints after a brief delay
      setTimeout(loadCheckpoints, 2000)
    } catch (e) {
      console.error(e)
      toast.error("Gửi lệnh kích hoạt đồng bộ thất bại")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800">
      {/* Sub-header */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <Server className="h-4.5 w-4.5 text-[#C41E3A]" />
          <h1 className="text-sm font-semibold text-slate-900">ERP Sync Checkpoints (Giám sát Tiến trình Đồng bộ)</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCheckpoints} disabled={loading || syncing} className="h-7 text-xs flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button size="sm" onClick={handleTriggerSync} disabled={syncing || loading} className="h-7 text-xs bg-[#C41E3A] hover:bg-[#A01830] text-white flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            Đồng bộ thủ công ngay
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 max-w-5xl w-full mx-auto space-y-4">
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Tình trạng các tiến trình đồng bộ mirror</h2>
          
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              Đang tải dữ liệu checkpoints...
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2 border border-dashed rounded-md">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              Chưa ghi nhận checkpoint đồng bộ nào trong database. Hãy chạy đồng bộ thủ công để khởi tạo.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Mã Tenant</TableHead>
                    <TableHead className="text-xs font-bold">Loại Thực Thể</TableHead>
                    <TableHead className="text-xs font-bold">Dấu kiểm (Last Success Cursor)</TableHead>
                    <TableHead className="text-xs font-bold">Đồng bộ cuối cùng</TableHead>
                    <TableHead className="text-xs font-bold w-[120px] text-center">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkpoints.map((checkpoint) => (
                    <TableRow key={checkpoint.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs font-bold">{checkpoint.tenantId}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold capitalize text-slate-900">{checkpoint.entityType}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] max-w-[200px] truncate" title={checkpoint.lastSuccessCursor}>
                        {checkpoint.lastSuccessCursor || "Empty / Initial Sync"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {checkpoint.lastSyncedAt === "0001-01-01T00:00:00" || new Date(checkpoint.lastSyncedAt).getFullYear() <= 1970
                          ? "Chưa từng đồng bộ"
                          : new Date(checkpoint.lastSyncedAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          checkpoint.lastSuccessCursor ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          <CheckCircle className="h-3 w-3" />
                          {checkpoint.lastSuccessCursor ? "Active" : "Ready"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs text-slate-600 leading-relaxed shadow-sm">
          <h4 className="font-bold flex items-center gap-1 text-[#C41E3A]">
            <Clock className="h-4 w-4 shrink-0" />
            Lưu ý cấu hình đồng bộ (Synchronization System Notes):
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Mặc định, nền tảng chạy ngầm dịch vụ <strong>ErpSyncWorker</strong> để đồng bộ tự động hàng hóa (SKU) và chi nhánh kho hàng (Warehouse) từ ERP sang WMS.</li>
            <li>Khi chọn <strong>Đồng bộ thủ công ngay</strong>, hệ thống sẽ gửi tín hiệu kích hoạt bất đồng bộ ngay lập tức và tiến hành tải mirror dữ liệu.</li>
            <li>Trường <code>LastSuccessCursor</code> là cơ chế ghi dấu phân trang tự động từ ERP, tránh tải lại các dữ liệu trùng lặp.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
