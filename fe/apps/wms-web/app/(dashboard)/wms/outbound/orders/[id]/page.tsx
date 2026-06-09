"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { OutboundOrderDto, OutboundOrderTimelineDto, OutboundOrderStatus } from "@/types/wms-outbound"
import { getOrderById, getPickTasksByOrder, getOrderTimeline, allocateOrder } from "@/lib/api/wms-outbound"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Loader2, ArrowLeft, Package, MapPin, Map, Calendar, ListChecks, CheckCircle2, Clock, QrCode } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { QrActionModal } from "@/components/wms/qrcode/QrActionModal"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { useSession } from "next-auth/react"
import { getQrImageUrl } from "@/lib/services/qrcode"

export default function OutboundOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const { data: session } = useSession()
  const [order, setOrder] = useState<OutboundOrderDto | null>(null)
  const [timeline, setTimeline] = useState<OutboundOrderTimelineDto[]>([])
  const [pickTasks, setPickTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAllocating, setIsAllocating] = useState(false)

  // Printable QR Code Dialog states
  const [printQrUrl, setPrintQrUrl] = useState<string | null>(null)
  const [printQrTitle, setPrintQrTitle] = useState("")

  const loadPrintQr = async () => {
    if (!order) return
    try {
      const url = await getQrImageUrl('outbound-order', order.id, session?.accessToken)
      setPrintQrUrl(url)
      setPrintQrTitle(`Đơn xuất kho WMS: ${order.orderNo}`)
    } catch (e) {
      toast.error("Không thể sinh ảnh QR Code cho đơn hàng này.")
    }
  }

  const handlePrint = () => {
    if (!printQrUrl) return
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>In nhãn QR - ${printQrTitle}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: monospace; }
              img { width: 300px; height: 300px; }
              .title { font-size: 24px; font-weight: bold; margin-top: 15px; }
              .footer { font-size: 14px; color: #555; margin-top: 5px; }
            </style>
          </head>
          <body>
            <img src="${printQrUrl}" onload="window.print(); window.close();" />
            <div class="title">${printQrTitle}</div>
            <div class="footer">Hệ thống Logistics Management System (LMS)</div>
          </body>
        </html>
      `)
      win.document.close()
    }
  }

  const handleAllocate = async () => {
    if (!orderId) return
    setIsAllocating(true)
    try {
      const result = await allocateOrder(orderId)
      if (result.success) {
        toast.success("Cấp phát tồn kho thành công và đã tạo công việc nhặt hàng!")
        await fetchOrderDetails()
      } else {
        toast.error("Không thể cấp phát tồn kho")
      }
    } catch (error) {
      toast.error("Lỗi khi cấp phát tồn kho")
    } finally {
      setIsAllocating(false)
    }
  }

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    setIsLoading(true)
    try {
      const [orderData, pickTasksData, timelineData] = await Promise.all([
        getOrderById(orderId),
        getPickTasksByOrder(orderId),
        getOrderTimeline(orderId)
      ])
      
      if (orderData) setOrder(orderData)
      if (pickTasksData) setPickTasks(pickTasksData)
      if (timelineData) setTimeline(timelineData)
    } catch (error) {
      toast.error("Không thể tải chi tiết đơn xuất kho")
    } finally {
      setIsLoading(false)
    }
  }

  const formatStatus = (status: OutboundOrderStatus) => {
    switch (status) {
      case 'New': return <Badge variant="outline" className="bg-zinc-100 text-zinc-700">Mới tạo</Badge>;
      case 'Allocating': return <Badge variant="outline" className="bg-blue-50 text-blue-600">Cấp phát...</Badge>;
      case 'Allocated': return <Badge variant="outline" className="bg-indigo-50 text-indigo-600">Đã cấp phát</Badge>;
      case 'Picking': return <Badge variant="outline" className="bg-amber-50 text-amber-600 animate-pulse">Đang lấy hàng</Badge>;
      case 'Picked': return <Badge variant="outline" className="bg-orange-50 text-orange-600">Đã lấy hàng</Badge>;
      case 'Packing': return <Badge variant="outline" className="bg-violet-50 text-violet-600">Đang đóng gói</Badge>;
      case 'Packed': return <Badge variant="outline" className="bg-purple-50 text-purple-600">Đã đóng gói</Badge>;
      case 'Loaded': return <Badge variant="outline" className="bg-sky-50 text-sky-600">Đã xếp xe</Badge>;
      case 'Shipped': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600">Đã xuất kho</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
        <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Không tìm thấy đơn xuất kho</h2>
        <p className="text-muted-foreground mb-4">Đơn xuất kho bạn yêu cầu không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Button onClick={() => router.push('/wms/outbound/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>
    )
  }

  const totalLines = order.lines?.length || 0
  const totalQty = order.lines?.reduce((sum, l) => sum + l.quantity, 0) || 0

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-muted pb-5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full border bg-card hover:bg-muted/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight font-mono">
                {order.orderNo}
              </h1>
              {formatStatus(order.status)}
            </div>
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> 
              Ngày tạo: {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss")}
              <span className="mx-2 text-muted-foreground/30">|</span>
              <Map className="h-3.5 w-3.5" /> 
              Chủ Hàng: <span className="font-semibold text-foreground">{order.tenantId}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Nút Allocate (Cấp phát tồn kho) */}
          {order.status === 'New' && (
            <Button
              variant="outline"
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 font-semibold"
              onClick={handleAllocate}
              disabled={isAllocating}
            >
              {isAllocating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cấp phát...
                </>
              ) : (
                "Allocate (Cấp phát)"
              )}
            </Button>
          )}

          {/* Quét Lấy Hàng (Pick) */}
          {(order.status === 'Allocated' || order.status === 'Picking' || order.status === 'PartiallyPicked') && (
            <QrActionModal
              title="Quét Lấy Hàng (Pick)"
              actionLabel="Quét Lấy Hàng"
              endpoint="/qrcode/actions/confirm-pick"
              buttonProps={{ variant: "outline", className: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" }}
              payloadTemplate={{ pickTaskId: pickTasks[0]?.id }} // Lấy task đầu tiên để test
              fields={[
                { name: "scannedBin", label: "Mã Ô Kệ (Bin)", placeholder: "BIN:..." },
                { name: "scannedSku", label: "Mã Sản Phẩm (SKU)", placeholder: "SKU:..." },
                { name: "quantity", label: "Số Lượng Thực Lấy", type: "number" }
              ]}
              suggestions={{
                scannedBin: pickTasks[0]?.fromBin?.binCode || 'BIN-RETURN',
                scannedSku: pickTasks[0]?.outboundOrderLine?.sku || '',
                quantity: pickTasks[0]?.quantity || 1
              }}
              onSuccess={fetchOrderDetails}
            />
          )}

          {/* Quét Đóng Gói (Pack) */}
          {(order.status === 'Picked' || order.status === 'PartiallyPicked' || order.status === 'Packing') && (
            <QrActionModal
              title="Quét Đóng Gói (Verify Pack)"
              actionLabel="Quét Đóng Gói"
              endpoint="/qrcode/actions/verify-pack"
              buttonProps={{ variant: "outline", className: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-200" }}
              payloadTemplate={{ outboundOrderId: order.id }}
              fields={[
                { name: "scannedSku", label: "Mã Sản Phẩm (SKU)", placeholder: "SKU:..." },
                { name: "quantity", label: "Số Lượng Thực Tế", type: "number" }
              ]}
              suggestions={{
                scannedSku: order.lines?.[0]?.sku || '',
                quantity: order.lines?.[0]?.quantity || 1
              }}
              onSuccess={fetchOrderDetails}
            />
          )}
          
          <Button 
            variant="outline" 
            className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
            onClick={loadPrintQr}
          >
            <QrCode className="h-4 w-4 mr-2" />
            Xem mã QR
          </Button>

          <Button variant="outline" onClick={() => {
            window.open(`/api/wms/qrcode/outbound-order/${order.id}`, '_blank')
          }}>
            In Tem Thùng
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Lines Card */}
          <Card className="shadow-sm border-muted overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Danh Sách Hàng Hóa (Lines)
                </CardTitle>
                <div className="text-sm">
                  Tổng mã: <span className="font-bold font-mono">{totalLines}</span> | 
                  Tổng SL: <span className="font-bold font-mono text-primary">{totalQty}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="font-bold">Mã Hàng (SKU)</TableHead>
                    <TableHead className="font-bold text-center">Số Lượng Yêu Cầu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines?.map((line, idx) => (
                    <TableRow key={line.id || idx}>
                      <TableCell className="font-mono font-bold text-primary">{line.sku}</TableCell>
                      <TableCell className="text-center font-mono font-semibold">{line.quantity}</TableCell>
                    </TableRow>
                  ))}
                  {(!order.lines || order.lines.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-muted-foreground text-sm">
                        Không có hàng hóa nào trong đơn này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pick Tasks Card */}
          <Card className="shadow-sm border-muted overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-amber-500" />
                Tác Vụ Lấy Hàng (Pick Tasks)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="font-bold">Mã SKU</TableHead>
                    <TableHead className="font-bold text-center">Vị trí Kệ (Bin)</TableHead>
                    <TableHead className="font-bold text-center">Mã Sóng (Wave ID)</TableHead>
                    <TableHead className="font-bold text-center">SL Cần Lấy</TableHead>
                    <TableHead className="font-bold text-center">Trạng Thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pickTasks.map((task, idx) => (
                    <TableRow key={task.id || idx}>
                      <TableCell className="font-mono font-semibold">{task.outboundOrderLine?.sku || 'Unknown'}</TableCell>
                      <TableCell className="text-center font-mono font-bold text-indigo-600">{task.fromBin?.binCode || 'N/A'}</TableCell>
                      <TableCell className="text-center font-mono">{task.waveId || 'N/A'}</TableCell>
                      <TableCell className="text-center font-mono">{task.quantity}</TableCell>
                      <TableCell className="text-center">
                        {task.status === 3 || task.status === 'Completed' ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600">Hoàn thành</Badge>
                        ) : task.status === 2 || task.status === 'InProgress' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 animate-pulse">Đang lấy</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-zinc-100 text-zinc-500">Chờ lấy</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pickTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                        Chưa sinh tác vụ lấy hàng (Có thể đơn chưa được cấp phát).
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline & Meta */}
        <div className="space-y-6">
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-4 border-b bg-muted/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                Lịch sử xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
                {timeline.map((item, index) => (
                  <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-background bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] bg-card border rounded-lg p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-sm text-foreground">{item.status}</div>
                        <time className="font-mono text-[10px] text-muted-foreground">
                          {format(new Date(item.occurredAt), "HH:mm dd/MM")}
                        </time>
                      </div>
                      {item.notes && <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>}
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-4">Chưa có lịch sử.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      {/* Printable QR Code Dialog */}
      {printQrUrl && (
        <Dialog open={!!printQrUrl} onOpenChange={(open) => !open && setPrintQrUrl(null)}>
          <DialogContent className="max-w-xs w-full bg-slate-900 border-slate-800 shadow-2xl text-white">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C41E3A]" />
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm font-bold text-slate-100">Tem Nhãn QR Code Đơn Hàng</DialogTitle>
              <DialogDescription className="text-[10px] text-slate-400 font-mono mt-0.5">{printQrTitle}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-white p-3 rounded-lg flex items-center justify-center border border-slate-800">
                <img src={printQrUrl} className="w-48 h-48 block" alt="Printable QR Code" />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  onClick={() => setPrintQrUrl(null)}
                >
                  Đóng
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#C41E3A] hover:bg-[#a01830] text-white font-bold"
                  onClick={handlePrint}
                >
                  In mã QR
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  )
}
