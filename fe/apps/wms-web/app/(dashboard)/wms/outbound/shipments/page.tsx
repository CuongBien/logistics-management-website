"use client"

import { useState, useEffect } from "react"
import { ShipmentDto, getShipments, dispatchShipment, getShipmentOrders } from "@/lib/api/wms-outbound"
import { OutboundOrderDto } from "@/types/wms-outbound"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Loader2, Truck, Milestone, Search, RefreshCw, CheckCircle2, Navigation, Clock, AlertTriangle, Eye } from "lucide-react"
import { Input } from "@repo/ui/components/input"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@repo/ui/components/dialog"

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentDto[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Detail Modal state
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDto | null>(null)
  const [shipmentOrders, setShipmentOrders] = useState<OutboundOrderDto[]>([])
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  
  const { activeWarehouseId } = useWarehouseContext()

  const fetchShipments = async () => {
    setIsLoading(true)
    try {
      const data = await getShipments(activeWarehouseId || undefined)
      setShipments(data)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi tải danh sách chuyến hàng")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [activeWarehouseId])

  const handleDispatch = async (id: string, shipmentNo: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xuất phát chuyến hàng ${shipmentNo}?`)) return
    setActionLoading(id)
    try {
      const res = await dispatchShipment(id)
      if (res.success) {
        toast.success(`Chuyến hàng ${shipmentNo} đã được xuất phát thành công!`)
        fetchShipments()
      }
    } catch (e: any) {
      toast.error(e.message || "Xuất phát chuyến hàng thất bại")
    } finally {
      setActionLoading(null)
    }
  }

  // Filter
  const filteredShipments = shipments.filter(
    (s) =>
      s.shipmentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.carrier && s.carrier.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.trackingNo && s.trackingNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.routeId && s.routeId.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusNumber = (status: number | string): number => {
    if (typeof status === 'number') return status;
    switch (status) {
      case 'Planned': return 1;
      case 'Loading': return 2;
      case 'ReadyToShip': return 3;
      case 'Shipped': return 4;
      case 'InTransit': return 5;
      case 'Delivered': return 6;
      case 'Failed': return 7;
      case 'Returned': return 8;
      case 'Cancelled': return 9;
      default: return 0;
    }
  }

  // Status mapping
  const getStatusBadge = (status: number | string) => {
    const s = typeof status === 'string' ? status : status.toString();
    switch (s) {
      case '1':
      case 'Planned':
        return <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 font-bold px-2 py-0.5">Planned</Badge>
      case '2':
      case 'Loading':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold px-2 py-0.5">Loading</Badge>
      case '3':
      case 'ReadyToShip':
      case 'Ready to Ship':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold px-2 py-0.5">Ready to Ship</Badge>
      case '4':
      case 'Shipped':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold px-2 py-0.5">Shipped</Badge>
      case '5':
      case 'InTransit':
      case 'In Transit':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-bold px-2 py-0.5 animate-pulse">In Transit</Badge>
      case '6':
      case 'Delivered':
        return <Badge variant="outline" className="bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20 font-bold px-2 py-0.5">Delivered</Badge>
      case '7':
      case 'Failed':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold px-2 py-0.5">Failed</Badge>
      case '8':
      case 'Returned':
        return <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20 font-bold px-2 py-0.5">Returned</Badge>
      case '9':
      case 'Cancelled':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 font-bold px-2 py-0.5">Cancelled</Badge>
      default:
        return <Badge variant="outline">Unknown ({s})</Badge>
    }
  }

  const getDestinationTypeLabel = (type: number | string) => {
    const t = typeof type === 'string' ? type : type.toString();
    switch (t) {
      case '0':
      case 'Warehouse':
        return "Kho Trung Chuyển (Hub)"
      case '1':
      case 'Customer':
        return "Khách Hàng (Customer)"
      case '2':
      case 'Other':
        return "Khác"
      default:
        return `Khác (${t})`
    }
  }

  // Calculate KPI stats
  const totalShipments = shipments.length
  const activeShipments = shipments.filter(s => {
    const num = getStatusNumber(s.status);
    return num === 2 || num === 3 || num === 5;
  }).length
  const shippedShipments = shipments.filter(s => {
    const num = getStatusNumber(s.status);
    return num === 4 || num === 6;
  }).length
  const plannedShipments = shipments.filter(s => getStatusNumber(s.status) === 1).length

  const handleViewDetails = async (shipment: ShipmentDto) => {
    setSelectedShipment(shipment)
    setIsDetailLoading(true)
    setShipmentOrders([])
    try {
      const orders = await getShipmentOrders(shipment.id)
      setShipmentOrders(orders)
    } catch (error) {
      console.error(error)
      toast.error("Lỗi khi tải chi tiết đơn hàng")
    } finally {
      setIsDetailLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Quản Lý Chuyến Hàng (Shipments)
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý việc xếp dỡ, gán hãng vận chuyển, theo dõi lộ trình và xác nhận xuất phát (Dispatch) các xe trung chuyển chặng dài/chặng cuối.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchShipments} 
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Total Shipments */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng số Chuyến Hàng
            </CardTitle>
            <Truck className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalShipments}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Tổng số chuyến hàng phát sinh trong hệ thống.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Planned */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-zinc-400" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Chuyến Đang Lên Kế Hoạch
            </CardTitle>
            <Clock className="h-4.5 w-4.5 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-zinc-600 dark:text-zinc-400">
              {isLoading ? "..." : plannedShipments}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đang gom hàng và chờ gán xe tải/hãng vận chuyển.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Loading / Ready / In Transit */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Chuyến Hàng Đang Xử Lý
            </CardTitle>
            <Navigation className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : activeShipments}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Chuyến hàng đang xếp hàng hoặc đang di chuyển trên đường.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Shipped / Delivered */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Chuyến Hàng Hoàn Thành
            </CardTitle>
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : shippedShipments}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Chuyến hàng đã bàn giao xe tải hoặc giao thành công.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-muted p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm chuyến hàng theo mã (ShipmentNo), đối tác vận chuyển (Carrier), hoặc mã định tuyến (Route)..."
            className="pl-10 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Shipments Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">Mã Chuyến Hàng</TableHead>
                  <TableHead className="font-bold">Đơn Vị Vận Chuyển</TableHead>
                  <TableHead className="font-bold">Nơi Đến (Destination)</TableHead>
                  <TableHead className="font-bold">Mã Lộ Trình (Route)</TableHead>
                  <TableHead className="font-bold">Trạng Thái</TableHead>
                  <TableHead className="font-bold">Ngày Tạo</TableHead>
                  <TableHead className="font-bold text-right w-[240px]">Hành Động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((s) => {
                  const statusNum = getStatusNumber(s.status);
                  const canDispatch = statusNum < 4; // Planned = 1, Loading = 2, ReadyToShip = 3

                  return (
                    <TableRow key={s.id} className="hover:bg-muted/15 transition-colors">
                      <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {s.shipmentNo}
                      </TableCell>
                      <TableCell>
                        {s.carrier ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{s.carrier}</span>
                            <span className="text-xs text-muted-foreground font-mono">Bill: {s.trackingNo || "N/A"}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Chưa chỉ định xe</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{s.destinationId}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{getDestinationTypeLabel(s.destinationType)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-xs text-indigo-600">
                        {s.routeId || "N/A"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(s.status)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {format(new Date(s.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(s)}
                            className="font-bold h-8 text-xs flex items-center gap-1.5"
                          >
                            <Eye className="h-3 w-3" />
                            Chi tiết
                          </Button>
                          
                          {canDispatch && (
                            <Button
                              size="sm"
                              onClick={() => handleDispatch(s.id, s.shipmentNo)}
                              disabled={actionLoading !== null}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs shrink-0 flex items-center gap-1"
                            >
                              {actionLoading === s.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Navigation className="h-3 w-3" />
                              )}
                              Khởi hành
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredShipments.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[250px]">
              <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
              <p className="text-muted-foreground text-base font-medium">
                Không tìm thấy chuyến hàng nào phù hợp bộ lọc.
              </p>
            </div>
          )}
        </>
      )}

      {/* Shipment Details Dialog */}
      <Dialog open={selectedShipment !== null} onOpenChange={(open) => !open && setSelectedShipment(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Chi Tiết Chuyến Hàng {selectedShipment?.shipmentNo}
            </DialogTitle>
            <DialogDescription>
              Xem danh sách đơn hàng và các mặt hàng (SKU) thuộc chuyến hàng này.
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6 mt-4">
              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/40 p-4 rounded-xl border border-muted text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase">Đơn Vị Vận Chuyển / Hãng</span>
                  <span className="font-bold text-foreground mt-0.5 block">{selectedShipment.carrier || "Chưa chỉ định"}</span>
                  {selectedShipment.trackingNo && (
                    <span className="font-mono text-xs text-muted-foreground mt-0.5 block">Bill: {selectedShipment.trackingNo}</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase">Nơi Đến (Destination)</span>
                  <span className="font-bold text-foreground mt-0.5 block">{selectedShipment.destinationId}</span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{getDestinationTypeLabel(selectedShipment.destinationType)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs font-semibold uppercase">Lộ Trình / Trạng Thái</span>
                  <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    Route: {selectedShipment.routeId || "N/A"}
                  </span>
                  <div className="mt-1">{getStatusBadge(selectedShipment.status)}</div>
                </div>
              </div>

              {/* Orders List */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground border-b pb-2 flex items-center gap-2">
                  <Milestone className="h-4 w-4 text-indigo-600" />
                  Danh Sách Đơn Hàng ({shipmentOrders.length})
                </h3>

                {isDetailLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Đang tải thông tin đơn hàng...</span>
                  </div>
                ) : shipmentOrders.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl bg-muted/10 text-muted-foreground text-sm">
                    Không có đơn hàng nào thuộc chuyến hàng này.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {shipmentOrders.map((order) => (
                      <Card key={order.id} className="border-muted bg-card/40 hover:bg-card/75 transition-colors overflow-hidden">
                        <div className="bg-muted/30 px-4 py-3 border-b border-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-base">
                              {order.orderNo}
                            </span>
                            <Badge variant="outline" className="text-xs font-semibold">
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            Ngày tạo: {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-bold">Mã SKU</TableHead>
                                <TableHead className="font-bold text-right">Số Lượng Yêu Cầu</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.lines.map((line) => (
                                <TableRow key={line.id}>
                                  <TableCell className="font-mono font-semibold">{line.sku}</TableCell>
                                  <TableCell className="text-right font-mono font-bold">{line.quantity}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
