"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { WaveDto, PickTaskDto } from "@/types/wms-outbound"
import { getWaveById, getOptimizedPickTasks, startWave, releaseWave } from "@/lib/api/wms-outbound"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { Loader2, ArrowLeft, Layers, Play, Trash2, CheckCircle2, Hourglass, Box, AlertTriangle, Layers2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export default function WaveDetailPage() {
  const params = useParams()
  const router = useRouter()
  const waveId = params.id as string

  const [wave, setWave] = useState<WaveDto | null>(null)
  const [pickTasks, setPickTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog Actions
  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<"start" | "release" | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (waveId) {
      fetchData()
    }
  }, [waveId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [waveData, pickTasksData] = await Promise.all([
        getWaveById(waveId),
        getOptimizedPickTasks(waveId)
      ])
      
      if (waveData) setWave(waveData)
      if (pickTasksData) setPickTasks(pickTasksData)
    } catch (error) {
      toast.error("Không thể tải chi tiết Đợt sóng (Wave)")
    } finally {
      setIsLoading(false)
    }
  }

  const formatStatus = (status: WaveDto['status']) => {
    switch (status) {
      case 'New': return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 px-3 py-1 text-sm"><Hourglass className="h-4 w-4 mr-1 animate-pulse" /> Chờ bắt đầu</Badge>;
      case 'Picking': return <Badge variant="outline" className="bg-amber-50 text-amber-600 px-3 py-1 text-sm"><Play className="h-4 w-4 mr-1 animate-ping" /> Đang lấy hàng</Badge>;
      case 'Picked': return <Badge variant="outline" className="bg-indigo-50 text-indigo-600 px-3 py-1 text-sm">Đã lấy hàng</Badge>;
      case 'Completed': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 px-3 py-1 text-sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Hoàn thành</Badge>;
      default: return <Badge variant="outline" className="px-3 py-1 text-sm">{status}</Badge>;
    }
  }

  const handleConfirmAction = async () => {
    if (!wave || !actionType) return
    setActionLoading(true)
    try {
      if (actionType === "start") {
        await startWave(wave.id)
        toast.success(`Đã bắt đầu đợt sóng ${wave.waveNo}.`)
      } else {
        await releaseWave(wave.id)
        toast.success(`Đã hủy đợt sóng ${wave.waveNo}. Các đơn đã trở lại hàng chờ.`)
        router.push('/wms/outbound/waves')
        return
      }
      fetchData()
    } catch (e: any) {
      toast.error(e.message || "Thao tác thất bại")
    } finally {
      setActionLoading(false)
      setActionOpen(false)
      setActionType(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!wave) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <Layers2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Không tìm thấy đợt sóng</h2>
        <p className="text-muted-foreground mb-4">Đợt sóng này không tồn tại hoặc đã bị giải phóng.</p>
        <Button onClick={() => router.push('/wms/outbound/waves')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>
    )
  }

  // Progress metrics
  const completedTasks = pickTasks.filter(t => t.status === 2 || t.status === 'Completed').length
  const totalTasks = pickTasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full border bg-card hover:bg-muted/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight font-mono text-primary">
                {wave.waveNo}
              </h1>
              {formatStatus(wave.status)}
            </div>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              Loại sóng: <span className="text-foreground">{wave.type === 'Single-Item' ? 'Đơn đơn lẻ (Single)' : 'Đơn nhiều món (Multi)'}</span>
              <span className="mx-2 text-muted-foreground/30">|</span>
              Khởi tạo: {format(new Date(wave.createdAt), "dd/MM/yyyy HH:mm:ss")}
            </p>
          </div>
        </div>

        {wave.status === 'New' && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
              onClick={() => { setActionType("release"); setActionOpen(true) }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hủy Wave
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              onClick={() => { setActionType("start"); setActionOpen(true) }}
            >
              <Play className="h-4 w-4 mr-2" />
              Bắt đầu Picking
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Orders */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Số Đơn Hàng Phụ Trách</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-mono text-indigo-600">{wave.orderCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Đơn hàng đã được gom trong wave này</p>
          </CardContent>
        </Card>

        {/* KPI 2: Pick Tasks */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tổng Tác Vụ Lấy Hàng (Lines)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold font-mono text-blue-600">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Lượt lấy hàng cần thực hiện</p>
          </CardContent>
        </Card>

        {/* KPI 3: Progress */}
        <Card className="shadow-sm border-muted bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tiến Độ Picking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-extrabold font-mono text-emerald-600">{progressPercent}%</div>
              <div className="flex-1">
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hoàn thành {completedTasks} / {totalTasks} tác vụ</p>
          </CardContent>
        </Card>
      </div>

      {/* Pick Tasks List */}
      <Card className="shadow-sm border-muted flex-1 flex flex-col overflow-hidden">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Bảng Tổng Hợp Tác Vụ Lấy Hàng (Pick List)
          </CardTitle>
          <CardDescription>Danh sách đã được thuật toán sắp xếp theo lộ trình di chuyển tối ưu trong kho.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-auto">
          <Table>
            <TableHeader className="bg-white sticky top-0 border-b z-10">
              <TableRow>
                <TableHead className="font-bold w-16 text-center">STT</TableHead>
                <TableHead className="font-bold">Mã SKU</TableHead>
                <TableHead className="font-bold">Mã Đơn</TableHead>
                <TableHead className="font-bold text-center">Số Lượng</TableHead>
                <TableHead className="font-bold text-center">Trạng Thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pickTasks.map((task, idx) => (
                <TableRow key={task.id || idx} className="hover:bg-muted/10">
                  <TableCell className="text-center font-mono font-medium text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-mono font-bold text-primary">{task.sku || (task.outboundOrderLine?.sku) || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{task.outboundOrderLine?.outboundOrderId ? task.outboundOrderLine.outboundOrderId.substring(0, 8) + '...' : '-'}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-lg">{task.quantity}</TableCell>
                  <TableCell className="text-center">
                    {task.status === 2 || task.status === 'Completed' ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600">Đã lấy</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-600">Chờ lấy</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {pickTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Box className="h-10 w-10 mx-auto opacity-20 mb-2" />
                    Không có danh sách hàng hóa nào trong wave này.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "release" ? "text-rose-500" : "text-emerald-500"}`}>
              {actionType === "release" ? (
                <><AlertTriangle className="h-5 w-5" />Xác Nhận Hủy Đợt Sóng</>
              ) : (
                <><Play className="h-5 w-5" />Bắt Đầu Lấy Hàng</>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "release" ? (
                `Bạn có chắc muốn hủy Wave ${wave.waveNo}? Các đơn hàng sẽ bị đưa lại về trạng thái chờ gom sóng.`
              ) : (
                `Bắt đầu Wave ${wave.waveNo}. Tác vụ lấy hàng sẽ được chuyển xuống thiết bị quét mã của nhân viên.`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setActionOpen(false)} disabled={actionLoading}>
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              disabled={actionLoading}
              className={actionType === "release" ? "bg-rose-500 hover:bg-rose-600 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
