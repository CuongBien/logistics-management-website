"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { OutboundOrderDto, OutboundOrderStatus, OutboundOrderTimelineDto } from "@/types/wms-outbound"
import { getOrderById, getOrderTimeline, allocateOrder, cancelOrder, splitOrder } from "@/lib/api/wms-outbound"
import { TrackingTimeline } from "@/components/wms/outbound/TrackingTimeline"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ArrowLeft, ClipboardList, ShieldAlert, ArrowRightLeft, FileText, ChevronDown, Check, X, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

// Zod schemas for forms
const cancelSchema = z.object({
  reason: z.string().min(3, "Lý do hủy phải có ít nhất 3 ký tự"),
})

const splitSchema = z.object({
  splitQty: z.coerce.number().min(1, "Số lượng tách tối thiểu là 1"),
})

export default function OutboundOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [order, setOrder] = useState<OutboundOrderDto | null>(null)
  const [timeline, setTimeline] = useState<OutboundOrderTimelineDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog States
  const [cancelOpen, setCancelOpen] = useState(false)
  const [splitOpen, setSplitOpen] = useState(false)
  const [selectedLine, setSelectedLine] = useState<{ id: string; sku: string; quantity: number } | null>(null)

  const cancelForm = useForm<z.infer<typeof cancelSchema>>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "" }
  })

  const splitForm = useForm<z.infer<typeof splitSchema>>({
    resolver: zodResolver(splitSchema),
    defaultValues: { splitQty: 1 }
  })

  const fetchOrderDetail = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [orderData, timelineData] = await Promise.all([
        getOrderById(id),
        getOrderTimeline(id)
      ])
      if (orderData) {
        setOrder(orderData)
        setTimeline(timelineData)
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn xuất kho", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[300px] space-y-4">
        <ShieldAlert className="h-10 w-10 text-rose-500 animate-bounce" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy đơn xuất kho</h3>
          <p className="text-muted-foreground text-sm mt-1">Mã ID đơn xuất này không tồn tại hoặc đã bị hủy.</p>
        </div>
        <Button onClick={() => router.push('/wms/outbound/orders')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  // Action mutations handlers
  const handleAllocate = async () => {
    try {
      await allocateOrder(order.id)
      toast.success("Cấp phát tồn kho khả dụng thành công!")
      fetchOrderDetail()
    } catch (e: any) {
      toast.error(e.message || "Cấp phát thất bại")
    }
  }

  const handleCancelSubmit = async (values: z.infer<typeof cancelSchema>) => {
    try {
      await cancelOrder(order.id, values.reason)
      toast.success("Đã hủy đơn xuất kho thành công!")
      setCancelOpen(false)
      cancelForm.reset()
      fetchOrderDetail()
    } catch (e: any) {
      toast.error(e.message || "Hủy đơn thất bại")
    }
  }

  const openSplitDialog = (line: { id: string; sku: string; quantity: number }) => {
    setSelectedLine(line)
    splitForm.reset({ splitQty: Math.max(1, line.quantity - 1) })
    setSplitOpen(true)
  }

  const handleSplitSubmit = async (values: z.infer<typeof splitSchema>) => {
    if (!selectedLine) return
    if (values.splitQty >= selectedLine.quantity) {
      toast.error("Số lượng tách phải nhỏ hơn số lượng hiện tại")
      return
    }
    try {
      await splitOrder(order.id, selectedLine.id, values.splitQty)
      toast.success(`Đã tách thành công SKU ${selectedLine.sku} số lượng ${values.splitQty} sang đơn hàng mới!`)
      setSplitOpen(false)
      fetchOrderDetail()
    } catch (e: any) {
      toast.error(e.message || "Tách đơn hàng thất bại")
    }
  }

  // Format Outbound Status Badges Helper
  const formatStatus = (status: OutboundOrderStatus) => {
    switch (status) {
      case 'New':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 font-bold px-3 py-1 select-none">Mới tạo (New)</Badge>;
      case 'Allocating':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold px-3 py-1 select-none animate-pulse">Cấp phát...</Badge>;
      case 'Allocated':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-3 py-1 select-none">Đã cấp phát (Allocated)</Badge>;
      case 'AwaitingPick':
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold px-3 py-1 select-none">Chờ lấy hàng</Badge>;
      case 'Picking':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-3 py-1 select-none animate-pulse">Đang lấy hàng</Badge>;
      case 'Picked':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold px-3 py-1 select-none">Đã lấy hàng</Badge>;
      case 'Packing':
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold px-3 py-1 select-none">Đang đóng gói</Badge>;
      case 'Packed':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold px-3 py-1 select-none">Đã đóng gói (Packed)</Badge>;
      case 'Shipped':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-3 py-1 select-none">Đã xuất kho (Shipped)</Badge>;
      case 'Cancelled':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold px-3 py-1 select-none">Đã hủy (Cancelled)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  const formatTenant = (tenant: string) => {
    switch (tenant) {
      case 'tenant-shopee': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">Shopee</Badge>;
      case 'tenant-lazada': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">Lazada</Badge>;
      case 'tenant-tiktok': return <Badge variant="outline" className="bg-slate-900 text-white font-bold dark:bg-zinc-700">TikTok</Badge>;
      default: return <Badge variant="outline">{tenant}</Badge>;
    }
  }

  const isShippedOrCancelled = order.status === 'Shipped' || order.status === 'Cancelled'

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Detail Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted pb-5">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/wms/outbound/orders')}
            className="shrink-0 h-9 w-9 border-muted hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Chi Tiết Đơn Xuất: <span className="font-mono text-primary">{order.orderNo}</span>
              </h1>
              {formatStatus(order.status)}
              {formatTenant(order.tenantId)}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Quản lý tiến trình cấp phát, lấy hàng, đóng gói và override nghiệp vụ của đơn.
            </p>
          </div>
        </div>

        {/* Action Dropdown Menu (Manual Override) */}
        {!isShippedOrCancelled && (
          <div className="shrink-0 flex items-center gap-2">
            {order.status === 'New' && (
              <Button 
                onClick={handleAllocate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm h-9 flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" />
                Cấp Phát Tồn Kho
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 font-semibold flex items-center gap-1">
                  Manual Actions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border border-muted shadow-md rounded-lg w-[160px]">
                <DropdownMenuItem 
                  onClick={() => setCancelOpen(true)}
                  className="text-rose-500 cursor-pointer focus:bg-rose-500/10 flex items-center gap-2 font-medium"
                >
                  <X className="h-4 w-4" />
                  Hủy đơn hàng
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Info and Item Lines */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <Card className="border-muted relative overflow-hidden bg-card shadow-sm">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-primary" />
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Thông Tin Hành Chính
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Số đơn hàng xuất
                </span>
                <span className="font-mono text-base font-extrabold text-foreground">{order.orderNo}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Thời gian tạo đơn
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Product Lines List */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">Danh Sách Mặt Hàng Cần Xuất</h3>
            <div className="border border-muted rounded-xl overflow-hidden shadow-sm bg-card">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold">Mã SKU Sản Phẩm</TableHead>
                    <TableHead className="font-bold text-right">Số Lượng Yêu Cầu</TableHead>
                    <TableHead className="font-bold text-center">Trạng Thái Kho</TableHead>
                    {!isShippedOrCancelled && <TableHead className="font-bold text-center w-[100px]">Tách Lô</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines.map((line) => {
                    const isAllocated = order.status !== 'New' && order.status !== 'Allocating' && order.status !== 'Cancelled'

                    return (
                      <TableRow key={line.id} className="hover:bg-muted/15 transition-colors">
                        <TableCell className="align-middle font-bold font-mono text-sm py-4">
                          {line.sku}
                        </TableCell>
                        <TableCell className="align-middle text-right font-mono font-extrabold py-4">
                          {line.quantity}
                        </TableCell>
                        <TableCell className="align-middle text-center py-4">
                          {isAllocated ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold select-none">
                              Đã Cấp Phát
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-bold select-none">
                              Chờ Cấp Phát
                            </Badge>
                          )}
                        </TableCell>
                        {!isShippedOrCancelled && (
                          <TableCell className="align-middle text-center py-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openSplitDialog(line)}
                              disabled={line.quantity <= 1}
                              className="h-8 hover:bg-primary/10 hover:text-primary"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Right Column: Tracking Timeline */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Tiến Trình Trạng Thái (Timeline)</h3>
          <TrackingTimeline timeline={timeline} />
        </div>
      </div>

      {/* Manual Cancel Order Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-rose-500 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Xác Nhận Hủy Đơn Xuất Kho
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ giải phóng toàn bộ hàng hóa đã cấp phát dự giữ trong kho cho đơn {order.orderNo}.
            </DialogDescription>
          </DialogHeader>

          <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(handleCancelSubmit)} className="space-y-4">
              <FormField
                control={cancelForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhập lý do hủy đơn</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Khách hàng đổi ý, Sai thông tin địa chỉ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={cancelForm.formState.isSubmitting} className="bg-rose-500 hover:bg-rose-600 text-white">
                  {cancelForm.formState.isSubmitting ? "Đang hủy..." : "Đồng ý hủy đơn"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Split Order Line Dialog */}
      <Dialog open={splitOpen} onOpenChange={setSplitOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Tách Dòng Hàng Hóa (Split Line)
            </DialogTitle>
            <DialogDescription>
              Tách một phần số lượng của SKU <span className="font-bold text-foreground font-mono">{selectedLine?.sku}</span> sang một đơn hàng xuất con độc lập.
            </DialogDescription>
          </DialogHeader>

          {selectedLine && (
            <div className="bg-muted/40 border border-muted p-3 rounded-xl text-xs space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số lượng hiện có:</span>
                <span className="font-bold font-mono">{selectedLine.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Số lượng tối đa có thể tách:</span>
                <span className="font-bold font-mono text-primary">{selectedLine.quantity - 1}</span>
              </div>
            </div>
          )}

          <Form {...splitForm}>
            <form onSubmit={splitForm.handleSubmit(handleSplitSubmit)} className="space-y-4">
              <FormField
                control={splitForm.control}
                name="splitQty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng tách ra</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={selectedLine ? selectedLine.quantity - 1 : 1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setSplitOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={splitForm.formState.isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  {splitForm.formState.isSubmitting ? "Đang xử lý..." : "Xác nhận tách"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
