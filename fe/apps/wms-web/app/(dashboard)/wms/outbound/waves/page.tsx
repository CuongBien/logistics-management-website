"use client"

import { useState, useEffect } from "react"
import { WaveDto } from "@/types/wms-outbound"
import { getWaves, autoPlanWaves, startWave, releaseWave } from "@/lib/api/wms-outbound"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { Loader2, Layers, RefreshCw, Play, Trash2, Cpu, AlertTriangle, CheckCircle2, Hourglass, Eye } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { WarehouseContextSelector } from "@/components/wms/rbac/WarehouseContextSelector"
import Link from "next/link"

export default function WavePlanningPage() {
  const [waves, setWaves] = useState<WaveDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlanning, setIsPlanning] = useState(false)

  // Dialog States
  const [actionOpen, setActionOpen] = useState(false)
  const [selectedWave, setSelectedWave] = useState<WaveDto | null>(null)
  const [actionType, setActionType] = useState<"start" | "release" | null>(null)

  const { activeWarehouseId } = useWarehouseContext()

  // Fetch Waves List
  const fetchWaves = async () => {
    setIsLoading(true)
    try {
      const data = await getWaves(activeWarehouseId || undefined)
      setWaves(data)
    } catch (error) {
      toast.error("Lỗi khi tải danh sách đợt sóng (Waves)")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWaves()
  }, [activeWarehouseId])

  // Trigger Wave Planning Algorithm
  const handleAutoPlan = async () => {
    setIsPlanning(true)
    try {
      const res = await autoPlanWaves(activeWarehouseId || undefined)
      if (res.success) {
        if (res.createdWavesCount > 0) {
          toast.success(`Thuật toán chạy thành công! Đã tạo ${res.createdWavesCount} đợt sóng mới.`)
        } else {
          toast.info("Không có đơn xuất kho phù hợp ở trạng thái Mới (New) để gom sóng.")
        }
        fetchWaves()
      }
    } catch (error) {
      toast.error("Lỗi trong quá trình chạy thuật toán gom đơn")
    } finally {
      setIsPlanning(false)
    }
  }

  // Open confirmation dialog
  const openConfirmDialog = (wave: WaveDto, type: "start" | "release") => {
    setSelectedWave(wave)
    setActionType(type)
    setActionOpen(true)
  }

  // Confirm wave action
  const handleConfirmAction = async () => {
    if (!selectedWave || !actionType) return
    setIsLoading(true)
    setActionOpen(false)
    try {
      if (actionType === "start") {
        await startWave(selectedWave.id)
        toast.success(`Đã bắt đầu đợt sóng ${selectedWave.waveNo}. Danh sách Picking đã được đẩy xuống Scanner.`)
      } else {
        await releaseWave(selectedWave.id)
        toast.success(`Đã giải phóng đợt sóng ${selectedWave.waveNo}. Các đơn đã quay lại trạng thái tự do.`)
      }
      fetchWaves()
    } catch (e: any) {
      toast.error(e.message || "Thao tác thất bại")
    } finally {
      setIsLoading(false)
      setSelectedWave(null)
      setActionType(null)
    }
  }

  // Wave status color formatting helper
  const formatStatus = (status: WaveDto['status']) => {
    switch (status) {
      case 'New':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 font-bold px-2.5 py-0.5"><Hourglass className="h-3 w-3 mr-1 animate-pulse text-zinc-500" /> Chờ bắt đầu</Badge>;
      case 'Picking':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2.5 py-0.5"><Play className="h-3 w-3 mr-1 animate-ping text-amber-500" /> Đang lấy hàng</Badge>;
      case 'Picked':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-2.5 py-0.5">Đã lấy hàng</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2.5 py-0.5"><CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Đã hoàn thành</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Wave type styling helper
  const formatType = (type: WaveDto['type']) => {
    if (type === 'Single-Item') {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">Đơn đơn lẻ (Single)</Badge>;
    }
    return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-semibold">Đơn gom nhiều món (Multi)</Badge>;
  }

  // KPI Calculations
  const totalWaves = waves.length
  const activeWaves = waves.filter(w => w.status === 'Picking' || w.status === 'Picked').length
  const completedWaves = waves.filter(w => w.status === 'Completed').length

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* SEO Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Lập Kế Hoạch Sóng Xuất Kho (Wave Planning)
          </h1>
          <p className="text-muted-foreground mt-1">
            Gom nhiều đơn hàng xuất thành một đợt lấy hàng (Wave) để tối ưu hóa lộ trình di chuyển của nhân viên Picking.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <WarehouseContextSelector />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWaves}
            disabled={isLoading || isPlanning}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={handleAutoPlan}
            disabled={isLoading || isPlanning}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm h-9 flex items-center gap-1.5"
          >
            {isPlanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gom đơn...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                Chạy Auto-Plan Wave
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Waves */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng số Đợt Sóng (Waves)
            </CardTitle>
            <Layers className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalWaves}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Toàn bộ đợt sóng xuất kho đã tạo.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Active Waves */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Đợt Sóng Đang Thực Hiện
            </CardTitle>
            <Play className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : activeWaves}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Các đợt lấy hàng đang được nhân viên Scanner thực hiện.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Completed Waves */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Đợt Sóng Đã Hoàn Thành
            </CardTitle>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : completedWaves}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Các đợt sóng đã lấy sạch hàng và chia về rổ đóng gói.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Waves List Monitoring Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold w-[180px]">Mã Đợt Sóng</TableHead>
                <TableHead className="font-bold">Loại Wave</TableHead>
                <TableHead className="font-bold text-center w-[120px]">Số Đơn Gom</TableHead>
                <TableHead className="font-bold">Trạng Thái</TableHead>
                <TableHead className="font-bold">Ngày Khởi Tạo</TableHead>
                <TableHead className="font-bold text-right w-[180px]">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {waves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    Chưa có đợt sóng gom đơn nào được tạo. Hãy nhấn "Chạy Auto-Plan Wave" ở trên để gom đơn!
                  </TableCell>
                </TableRow>
              ) : (
                waves.map((wave) => (
                  <TableRow key={wave.id} className="hover:bg-muted/15 transition-colors">
                    <TableCell className="font-mono font-bold text-primary align-middle">
                      {wave.waveNo}
                    </TableCell>
                    <TableCell className="align-middle">
                      {formatType(wave.type)}
                    </TableCell>
                    <TableCell className="text-center font-mono font-extrabold align-middle">
                      {wave.orderCount}
                    </TableCell>
                    <TableCell className="align-middle">
                      {formatStatus(wave.status)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground align-middle">
                      {format(new Date(wave.createdAt), "dd/MM/yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-right align-middle space-x-1.5">
                      {wave.status === 'New' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openConfirmDialog(wave, "start")}
                            className="h-8 text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Bắt đầu Pick
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openConfirmDialog(wave, "release")}
                            className="h-8 text-rose-500 hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Hủy
                          </Button>
                        </>
                      )}
                      {wave.status !== 'New' && (
                        <span className="text-xs text-muted-foreground pr-3 italic select-none">
                          Đang vận hành
                        </span>
                      )}
                      <Link href={`/wms/outbound/waves/${wave.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 ml-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Chi tiết
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${actionType === "release" ? "text-rose-500" : "text-primary"}`}>
              {actionType === "release" ? (
                <>
                  <AlertTriangle className="h-5 w-5" />
                  Xác Nhận Hủy Đợt Sóng
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 text-emerald-500" />
                  Bắt Đầu Gom Picking
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {actionType === "release" ? (
                `Hành động này sẽ hủy đợt sóng ${selectedWave?.waveNo} và hoàn trả toàn bộ ${selectedWave?.orderCount} đơn hàng gom về hàng chờ xuất kho để phân đợt sóng khác.`
              ) : (
                `Xác nhận bắt đầu đợt sóng ${selectedWave?.waveNo}. Hệ thống sẽ chia luồng lấy hàng và xuất phiếu Picking danh sách tối ưu hóa cho nhân viên kho.`
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setActionOpen(false)}>
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              className={actionType === "release" ? "bg-rose-500 hover:bg-rose-600 text-white font-bold" : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"}
            >
              Đồng ý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
