"use client"

import { useState, useEffect } from "react"
import { getWarehouseRoutes, createWarehouseRoute, deleteWarehouseRoute, getWarehouses } from "@/lib/api/wms-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, Plus, Trash2, Milestone, ArrowRight, GitFork, MapPin, Building } from "lucide-react"
import { toast } from "sonner"

export default function WarehouseRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add Dialog States
  const [addOpen, setAddOpen] = useState(false)
  const [sourceId, setSourceId] = useState("")
  const [destId, setDestId] = useState("")
  const [nextHopId, setNextHopId] = useState("")

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [routeData, whData] = await Promise.all([
        getWarehouseRoutes(),
        getWarehouses()
      ])
      setRoutes(routeData)
      setWarehouses(whData)
    } catch (e) {
      toast.error("Không thể tải cấu hình định tuyến kho")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddClick = () => {
    if (warehouses.length < 2) {
      toast.error("Hệ thống cần ít nhất 2 kho hàng để cấu hình định tuyến!")
      return
    }
    setSourceId(warehouses[0]?.id || "")
    setDestId(warehouses[1]?.id || "")
    setNextHopId(warehouses[0]?.id || "")
    setAddOpen(true)
  }

  const handleCreateRoute = async () => {
    if (sourceId === destId) {
      toast.error("Kho xuất phát và kho đích không được trùng nhau!")
      return
    }
    setIsLoading(true)
    setAddOpen(false)
    try {
      await createWarehouseRoute({
        sourceWarehouseId: sourceId,
        destinationWarehouseId: destId,
        nextHopWarehouseId: nextHopId
      })
      toast.success("Cấu hình tuyến định tuyến trung chuyển thành công!")
      loadData()
    } catch (e: any) {
      toast.error(e.message || "Tạo tuyến định tuyến thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRoute = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình định tuyến này?")) return
    setIsLoading(true)
    try {
      await deleteWarehouseRoute(id)
      toast.success("Xóa tuyến định tuyến thành công!")
      loadData()
    } catch (e: any) {
      toast.error(e.message || "Xóa tuyến định tuyến thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  const getWarehouseName = (whId: string) => {
    const wh = warehouses.find(w => w.id === whId)
    return wh ? wh.name : "Warehouse"
  }

  const getWarehouseCode = (whId: string) => {
    const wh = warehouses.find(w => w.id === whId)
    return wh ? wh.code : "WH"
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Ma Trận Định Tuyến Kho (Hub-and-Spoke Routing)
          </h1>
          <p className="text-muted-foreground mt-1">
            Cấu hình các trạm trung chuyển (Next-Hop) giữa các kho hàng nội bộ nhằm phục vụ việc phân luồng xe tải và tính toán chặng vận chuyển tối ưu.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={handleAddClick}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm h-9 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Thêm định tuyến mới
          </Button>
        </div>
      </div>

      {/* Row 2: Routes Matrix Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold">Mã Tuyến Đường</TableHead>
                <TableHead className="font-bold">Kho Xuất Phát (Source)</TableHead>
                <TableHead className="font-bold w-[60px] text-center"></TableHead>
                <TableHead className="font-bold">Kho Đích (Destination)</TableHead>
                <TableHead className="font-bold">Trạm Trung Chuyển (Next Hop)</TableHead>
                <TableHead className="font-bold text-center">Hình Thức</TableHead>
                <TableHead className="font-bold text-right w-[120px]">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                    Chưa có cấu hình định tuyến kho nào được tạo. Nhấn "Thêm định tuyến mới" ở trên để bắt đầu!
                  </TableCell>
                </TableRow>
              ) : (
                routes.map((route) => {
                  const isDirect = route.destinationWarehouseId === route.nextHopWarehouseId

                  return (
                    <TableRow key={route.id} className="hover:bg-muted/15 transition-colors">
                      <TableCell className="font-mono font-bold text-primary align-middle">
                        RT-{getWarehouseCode(route.sourceWarehouseId)}-{getWarehouseCode(route.destinationWarehouseId)}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{getWarehouseName(route.sourceWarehouseId)}</span>
                          <span className="text-xs text-muted-foreground font-mono">{getWarehouseCode(route.sourceWarehouseId)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <ArrowRight className="h-4 w-4 text-slate-400" />
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{getWarehouseName(route.destinationWarehouseId)}</span>
                          <span className="text-xs text-muted-foreground font-mono">{getWarehouseCode(route.destinationWarehouseId)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{getWarehouseName(route.nextHopWarehouseId)}</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">{getWarehouseCode(route.nextHopWarehouseId)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        {isDirect ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5">Trực tiếp (Direct)</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold px-2 py-0.5">Trung tâm (Hub)</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-middle">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRoute(route.id)}
                          className="h-8 text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Milestone className="h-5 w-5" />
              Thêm Tuyến Định Tuyến Mới
            </DialogTitle>
            <DialogDescription>
              Thiết lập cấu hình định tuyến cho một chặng vận chuyển trung chuyển.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="source">Kho xuất phát (Source)</Label>
              <select
                id="source"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destination">Kho đích (Destination)</Label>
              <select
                id="destination"
                value={destId}
                onChange={(e) => setDestId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nexthop">Trạm trung chuyển tiếp theo (Next Hop)</Label>
              <select
                id="nexthop"
                value={nextHopId}
                onChange={(e) => setNextHopId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleCreateRoute}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Lưu tuyến đường
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
