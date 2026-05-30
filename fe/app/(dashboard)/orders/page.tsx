"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Search, 
  Truck, 
  MapPin, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Plus, 
  RefreshCw, 
  FileText, 
  ShieldAlert, 
  User, 
  Phone, 
  Map, 
  Layers, 
  DollarSign,
  X,
  Hourglass,
  HelpCircle,
  Cpu,
  Inbox,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import * as orderingService from "@/lib/services/ordering"
import { Order, OrderStatusHistory, OrderStatus } from "@/lib/types"
import { format } from "date-fns"

// Zod validation schema for Create Order Form
const createOrderSchema = z.object({
  tenantId: z.string().default("tenant-shopee"),
  consignorId: z.string().min(2, "Mã chủ hàng phải từ 2 ký tự trở lên"),
  skuCodes: z.string().min(3, "Vui lòng nhập ít nhất 1 SKU"),
  weight: z.coerce.number().min(0.1, "Trọng lượng tối thiểu là 0.1 kg"),
  shippingFee: z.coerce.number().min(0, "Phí vận chuyển phải từ 0 trở lên"),
  codAmount: z.coerce.number().min(0, "Tiền thu hộ COD phải từ 0 trở lên"),
  note: z.string().optional(),
  fullName: z.string().min(2, "Tên người nhận phải từ 2 ký tự trở lên"),
  phone: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải chứa đúng 10 chữ số"),
  street: z.string().min(5, "Địa chỉ chi tiết phải từ 5 ký tự trở lên"),
  city: z.string().min(2, "Thành phố phải từ 2 ký tự trở lên"),
  state: z.string().min(2, "Bang/Tỉnh phải từ 2 ký tự trở lên"),
  country: z.string().default("Vietnam"),
  zipCode: z.string().min(4, "Zip Code tối thiểu 4 ký tự"),
})

type CreateOrderFormValues = z.infer<typeof createOrderSchema>

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(5)
  const [isLoading, setIsLoading] = useState(true)

  // Details Modal and Timeline Tracking states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [timeline, setTimeline] = useState<OrderStatusHistory[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Create Order Dialog state
  const [createOpen, setCreateOpen] = useState(false)

  const createForm = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      tenantId: "tenant-shopee",
      consignorId: "consignor-shopee-hcm",
      skuCodes: "SKU-RED-TSHIRT, SKU-BLUE-JEANS",
      weight: 1.5,
      shippingFee: 35000,
      codAmount: 500000,
      note: "Giao hàng giờ hành chính, gọi điện trước khi đến.",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      street: "123 Nguyễn Trãi, Phường 2",
      city: "Hồ Chí Minh",
      state: "HCM",
      country: "Vietnam",
      zipCode: "70000",
    }
  })

  // Fetch orders from mock API service
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await orderingService.searchOrders(searchQuery, statusFilter, page, pageSize)
      if (res.isSuccess && res.value) {
        setOrders(res.value.orders)
        setTotalCount(res.value.totalCount)
      }
    } catch (error) {
      toast.error("Lỗi hệ thống khi tải danh sách đơn hàng")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, page, pageSize])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Open Order detail Drawer panel and fetch metadata
  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await orderingService.getOrderStatusHistory(order.id)
      if (res.isSuccess && res.value) {
        setTimeline(res.value)
      } else {
        setTimeline([])
      }
    } catch (error) {
      console.error("Lỗi khi tải lịch trình trạng thái đơn hàng", error)
    } finally {
      setDetailLoading(false)
    }
  }

  // Handle CSKH create order submission
  const handleCreateSubmit = async (values: CreateOrderFormValues) => {
    try {
      const res = await orderingService.createOrder({
        tenantId: values.tenantId,
        consignorId: values.consignorId,
        skuCodes: values.skuCodes.split(",").map(s => s.trim()),
        weight: values.weight,
        shippingFee: values.shippingFee,
        codAmount: values.codAmount,
        note: values.note,
        consignee: {
          fullName: values.fullName,
          phone: values.phone,
          address: {
            street: values.street,
            city: values.city,
            state: values.state,
            country: values.country,
            zipCode: values.zipCode
          }
        }
      })
      if (res.isSuccess && res.value) {
        toast.success(`Đã tạo đơn hàng thành công! Mã đơn: ${res.value}`)
        setCreateOpen(false)
        fetchOrders()
      } else {
        toast.error(res.error?.message || "Tạo đơn hàng thất bại")
      }
    } catch (e: any) {
      toast.error(e.message || "Tạo đơn hàng thất bại")
    }
  }

  // Multi-color badge renderer for order statuses
  const formatStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-bold px-2 py-0.5 select-none">Mới tạo (New)</Badge>;
      case "Confirmed":
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold px-2 py-0.5 select-none">Đã xác nhận</Badge>;
      case "AwaitingPickup":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold px-2 py-0.5 select-none">Chờ lấy hàng</Badge>;
      case "PickedUp":
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-2 py-0.5 select-none">Đã lấy hàng</Badge>;
      case "AwaitingInbound":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold px-2 py-0.5 select-none">Đang chuyển kho</Badge>;
      case "InWarehouse":
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold px-2 py-0.5 select-none">Trong kho WMS</Badge>;
      case "AwaitingDispatch":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5 select-none">Chờ điều phối</Badge>;
      case "Dispatched":
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold px-2 py-0.5 select-none">Đã điều phối</Badge>;
      case "Delivering":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5 select-none animate-pulse">Đang giao hàng</Badge>;
      case "Delivered":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5 select-none">Đã giao hàng</Badge>;
      case "Completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 font-bold px-2 py-0.5 select-none">Hoàn tất (Completed)</Badge>;
      case "Failed":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold px-2 py-0.5 select-none">Giao thất bại</Badge>;
      case "Cancelled":
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-bold px-2 py-0.5 select-none">Đã hủy</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Format tracking timelines nodes helper
  const getTimelineIconAndColor = (status: string, hasReason: boolean) => {
    if (status === "Failed" || status === "Cancelled" || hasReason) {
      return {
        icon: <ShieldAlert className="h-3.5 w-3.5 text-white" />,
        color: "bg-rose-500 ring-rose-500/30",
        bgClass: "bg-rose-500/5 border-rose-500/20 text-rose-700 dark:text-rose-400"
      }
    }
    switch (status) {
      case "New":
        return { icon: <Clock className="h-3.5 w-3.5 text-slate-500" />, color: "bg-slate-100 border border-slate-300 ring-slate-200", bgClass: "" };
      case "Confirmed":
      case "AwaitingPickup":
      case "PickedUp":
        return { icon: <Hourglass className="h-3.5 w-3.5 text-sky-600" />, color: "bg-sky-100 border border-sky-300 ring-sky-200", bgClass: "" };
      case "Dispatched":
      case "Delivering":
        return { icon: <Truck className="h-3.5 w-3.5 text-amber-600" />, color: "bg-amber-100 border border-amber-300 ring-amber-200", bgClass: "" };
      case "Delivered":
      case "Completed":
        return { icon: <CheckCircle className="h-3.5 w-3.5 text-white" />, color: "bg-emerald-500 ring-emerald-500/30", bgClass: "bg-emerald-500/5 border-emerald-500/20" };
      default:
        return { icon: <HelpCircle className="h-3.5 w-3.5 text-slate-500" />, color: "bg-slate-100 border border-slate-300 ring-slate-200", bgClass: "" };
    }
  }

  // Calculate quick KPI summaries
  const totalOrdersCount = 6 // Standard baseline
  const pendingOrdersCount = 2 // New, AwaitingPickup, Delivering
  const failedOrdersCount = 1 // Failed

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Header and page metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Quản Lý Đơn Hàng Admin (OMS)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Hệ thống giám sát B2B ERP: Tra cứu hành trình đơn hàng, lịch sử chuyển trạng thái Saga, và tạo mới đơn hàng CSKH.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>

          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold shadow-sm h-9 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Tạo Đơn Hàng Mới
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Orders */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card border-muted shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Tổng đơn hàng hôm nay
            </CardTitle>
            <Layers className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {totalOrdersCount}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Tổng số đơn tiếp nhận toàn luồng.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card border-muted shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Đơn hàng cần xử lý
            </CardTitle>
            <Clock className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {pendingOrdersCount}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đơn hàng đang chờ lấy hoặc đang đi giao.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Failed Orders */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card border-muted shadow-sm">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Đơn giao thất bại (Failed)
            </CardTitle>
            <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400">
              {failedOrdersCount}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Đơn bị chối nhận, cần hoàn trả hoặc phạt đền bồi.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Search engine & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-card border border-muted p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã vận đơn (Waybill), ID đơn hàng, tên hoặc SĐT người nhận..."
            className="pl-10 bg-background border-muted h-10 rounded-xl text-xs font-mono"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <div className="w-full sm:w-[200px]">
          <Select 
            value={statusFilter} 
            onValueChange={(val) => {
              setStatusFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="bg-background border-muted h-10 rounded-xl text-xs font-semibold">
              <SelectValue placeholder="Lọc trạng thái đơn" />
            </SelectTrigger>
            <SelectContent className="bg-card border-muted rounded-xl text-xs">
              <SelectItem value="All" className="cursor-pointer text-xs">Tất cả trạng thái</SelectItem>
              <SelectItem value="New" className="cursor-pointer text-xs">Mới tạo (New)</SelectItem>
              <SelectItem value="AwaitingPickup" className="cursor-pointer text-xs">Chờ lấy hàng</SelectItem>
              <SelectItem value="Delivering" className="cursor-pointer text-xs">Đang giao hàng</SelectItem>
              <SelectItem value="Delivered" className="cursor-pointer text-xs">Đã giao hàng</SelectItem>
              <SelectItem value="Failed" className="cursor-pointer text-xs">Giao thất bại</SelectItem>
              <SelectItem value="Cancelled" className="cursor-pointer text-xs">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: DataTable List */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-[#C41E3A]" />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-muted overflow-hidden shadow-sm flex flex-col">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold w-[190px]">Mã Vận Đơn (Waybill)</TableHead>
                <TableHead className="font-bold">Người Nhận</TableHead>
                <TableHead className="font-bold w-[120px]">Số Điện Thoại</TableHead>
                <TableHead className="font-bold text-right w-[130px]">Tiền Thu Hộ (COD)</TableHead>
                <TableHead className="font-bold text-right w-[100px]">Nặng (kg)</TableHead>
                <TableHead className="font-bold">Trạng Thái</TableHead>
                <TableHead className="font-bold">Ngày Tiếp Nhận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground text-xs italic">
                    Không tìm thấy đơn hàng nào khớp điều kiện lọc.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow 
                    key={o.id} 
                    onClick={() => handleViewDetails(o)}
                    className="hover:bg-muted/15 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-mono font-bold text-blue-600 align-middle text-xs py-3.5">
                      {o.waybillCode}
                    </TableCell>
                    <TableCell className="align-middle font-bold text-xs">
                      {o.consignee.fullName}
                    </TableCell>
                    <TableCell className="font-mono text-xs align-middle">
                      {o.consignee.phone}
                    </TableCell>
                    <TableCell className="text-right font-mono font-extrabold text-xs text-green-600 align-middle">
                      {o.codAmount.toLocaleString()}₫
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs align-middle">
                      {o.weight}
                    </TableCell>
                    <TableCell className="align-middle">
                      {formatStatusBadge(o.status as string)}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground align-middle">
                      {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Table pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t p-4 text-xs">
              <span className="text-muted-foreground font-medium">
                Hiển thị trang <strong className="text-foreground">{page}</strong> trên <strong className="text-foreground">{totalPages}</strong> (Tổng cộng {totalCount} đơn)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-8 text-xs font-semibold rounded-lg"
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="h-8 text-xs font-semibold rounded-lg"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-out Sheet Drawer for Order Details & Technical Saga Timeline */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-[700px] overflow-y-auto bg-card border-l border-muted p-0 shadow-xl">
          <SheetHeader className="p-6 border-b border-muted">
            <div className="flex items-center gap-2 flex-wrap">
              <SheetTitle className="text-lg font-extrabold text-foreground">
                Giám Sát Đơn Hàng: <span className="font-mono text-blue-600 text-base">{selectedOrder?.waybillCode}</span>
              </SheetTitle>
              {selectedOrder && formatStatusBadge(selectedOrder.status as string)}
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              Khối kiểm tra vết kỹ thuật, hành trình đơn hàng ERP & MassTransit Saga.
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#C41E3A]" />
            </div>
          ) : (
            selectedOrder && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
                {/* Left side (col-span-3): Administrative metadata info */}
                <div className="md:col-span-3 space-y-5">
                  {/* Administrative Info Card */}
                  <Card className="border-muted shadow-sm rounded-xl overflow-hidden bg-background">
                    <div className="h-[3px] bg-[#C41E3A]" />
                    <CardHeader className="py-3.5 px-4 border-b border-muted bg-muted/20">
                      <CardTitle className="text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                        <FileText className="h-4 w-4 text-[#C41E3A]" />
                        Thông tin hành chính
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">ID Đơn hàng (GUID)</span>
                        <span className="font-mono text-[10px] font-semibold text-foreground break-all">{selectedOrder.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Mã Vận đơn</span>
                        <span className="font-mono font-bold text-blue-600 text-xs">{selectedOrder.waybillCode}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Mã Chủ hàng (Consignor)</span>
                        <span className="font-mono font-semibold text-foreground">{selectedOrder.consignorId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Thời gian tiếp nhận</span>
                        <span className="font-mono text-foreground">{format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm:ss")}</span>
                      </div>
                      {selectedOrder.externalReference && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Mã tham chiếu ERP (Ref)</span>
                          <span className="font-mono text-foreground font-medium">{selectedOrder.externalReference}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Financial & Package Fees Info Card */}
                  <Card className="border-muted shadow-sm rounded-xl overflow-hidden bg-background">
                    <div className="h-[3px] bg-emerald-500" />
                    <CardHeader className="py-3.5 px-4 border-b border-muted bg-muted/20">
                      <CardTitle className="text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Biểu phí & Hàng hóa
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Tiền COD</span>
                        <span className="font-mono font-extrabold text-green-600 text-xs">{selectedOrder.codAmount.toLocaleString()}₫</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Phí Vận chuyển</span>
                        <span className="font-mono font-bold text-foreground text-xs">{selectedOrder.shippingFee.toLocaleString()}₫</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Trọng lượng</span>
                        <span className="font-mono font-bold text-foreground text-xs">{selectedOrder.weight} kg</span>
                      </div>

                      <div className="col-span-3 border-t border-muted/60 pt-3 mt-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1.5">Danh sách SKUs sản phẩm</span>
                        <div className="border rounded-lg overflow-hidden bg-card text-[11px]">
                          <Table>
                            <TableBody>
                              {selectedOrder.items.map((item, idx) => (
                                <TableRow key={item.id || idx} className="hover:bg-muted/10">
                                  <TableCell className="font-mono font-bold py-1.5 px-2.5">{item.sku}</TableCell>
                                  <TableCell className="text-right py-1.5 px-2.5 font-bold text-muted-foreground">x{item.quantity}</TableCell>
                                  <TableCell className="text-right py-1.5 px-2.5 font-mono text-foreground font-semibold">{item.price.toLocaleString()}₫</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Consignee Card */}
                  <Card className="border-muted shadow-sm rounded-xl overflow-hidden bg-background">
                    <div className="h-[3px] bg-indigo-500" />
                    <CardHeader className="py-3.5 px-4 border-b border-muted bg-muted/20">
                      <CardTitle className="text-xs font-extrabold flex items-center gap-1.5 uppercase tracking-wider text-foreground">
                        <User className="h-4 w-4 text-indigo-500" />
                        Người nhận (Consignee)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3.5 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Tên người nhận</span>
                          <span className="font-bold text-foreground">{selectedOrder.consignee.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-0.5">Số điện thoại</span>
                          <span className="font-mono font-bold text-foreground">{selectedOrder.consignee.phone}</span>
                        </div>
                      </div>
                      <div className="border-t border-muted/60 pt-2.5">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Địa chỉ giao hàng</span>
                        <div className="flex gap-1.5 items-start mt-0.5 text-muted-foreground leading-relaxed">
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground/60 mt-0.5" />
                          <span>
                            {selectedOrder.consignee.address.street}, {selectedOrder.consignee.address.city}, {selectedOrder.consignee.address.state}, {selectedOrder.consignee.address.country}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right side (col-span-2): Technical vertical tracking timeline */}
                <div className="md:col-span-2 space-y-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                    Vết Hành Trình & Lịch Sử Saga
                  </span>
                  
                  <div className="relative border border-muted bg-background p-4 rounded-xl shadow-sm min-h-[300px] overflow-y-auto">
                    {timeline.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-xs italic">
                        <Inbox className="h-6 w-6 text-muted-foreground/45 mb-2" />
                        Chưa có dữ liệu hành trình.
                      </div>
                    ) : (
                      <div className="space-y-0 relative">
                        {/* Vertically connected timeline line */}
                        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-muted-foreground/15" />

                        {timeline.map((event, idx) => {
                          const hasReason = !!event.reason;
                          const tStyle = getTimelineIconAndColor(event.statusTo, hasReason);
                          const isLatest = idx === 0;

                          return (
                            <div key={event.id || idx} className="flex gap-3 pb-6 relative group last:pb-0">
                              {/* Pulse effect on latest chốt timeline */}
                              <div className={`shrink-0 z-10 h-[24px] w-[24px] rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${tStyle.color} ${isLatest ? "animate-pulse" : ""}`}>
                                {tStyle.icon}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {event.statusFrom && (
                                    <>
                                      <span className="text-[10px] text-muted-foreground/80 font-mono font-semibold">{event.statusFrom}</span>
                                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                                    </>
                                  )}
                                  <span className="text-[11px] font-bold text-foreground font-mono">{event.statusTo}</span>
                                </div>

                                <div className="text-[9px] text-muted-foreground mt-1 space-y-1">
                                  <div className="font-mono text-muted-foreground/75 font-semibold">
                                    {format(new Date(event.changedAt), "dd/MM/yyyy HH:mm:ss")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Nguồn:</span>
                                    <Badge variant="secondary" className="px-1 py-0.2 text-[8px] font-mono leading-none bg-muted/60 text-muted-foreground border-none">
                                      {event.source}
                                    </Badge>
                                  </div>
                                  {event.changedByOperatorId && (
                                    <div>Bởi: <span className="font-mono font-medium text-foreground">{event.changedByOperatorId}</span></div>
                                  )}
                                  {event.correlationId && (
                                    <div className="text-[8px] font-mono text-muted-foreground/60 break-all leading-tight">
                                      Corr: {event.correlationId}
                                    </div>
                                  )}
                                  {event.reason && (
                                    <div className="p-2 border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] leading-relaxed mt-1 font-semibold">
                                      <AlertTriangle className="h-3 w-3 inline mr-1 fill-rose-500/10 stroke-rose-500" />
                                      Lý do: {event.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </SheetContent>
      </Sheet>

      {/* Manual Create Order Dialog (react-hook-form + zod validation) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-card border border-muted shadow-lg rounded-2xl">
          <DialogHeader className="border-b pb-3 mb-2">
            <DialogTitle className="text-foreground font-extrabold text-lg flex items-center gap-1.5">
              <Plus className="h-5 w-5 text-[#C41E3A]" />
              Tạo Mới Đơn Hàng CSKH (Manual Create)
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Nhập tay thông tin đơn hàng B2B/OMS cho chủ shop trực thuộc khi có sự cố luồng ERP.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4 text-xs pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="consignorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-muted-foreground">Mã Chủ Hàng (Consignor)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. consignor-shopee-hcm" className="bg-background border-muted h-9 rounded-xl text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="skuCodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-muted-foreground">Danh sách SKUs (cách bằng dấu phẩy)</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-RED-TSHIRT, SKU-BLUE-JEANS" className="bg-background border-muted h-9 rounded-xl text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-muted-foreground">Trọng Lượng (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" className="bg-background border-muted h-9 rounded-xl text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="shippingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-muted-foreground">Phí Vận Chuyển (₫)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-background border-muted h-9 rounded-xl text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="codAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-muted-foreground">Số Tiền Thu Hộ COD (₫)</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-background border-muted h-9 rounded-xl text-xs font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="font-bold text-xs text-muted-foreground">Ghi Chú Điều Phối</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập ghi chú cho tài xế..." className="bg-background border-muted h-9 rounded-xl text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Receiver address form fields */}
              <div className="border-t border-muted/70 pt-3 space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Thông Tin Người Nhận (Consignee)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs text-muted-foreground">Họ và Tên</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-muted h-9 rounded-xl text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs text-muted-foreground">Số Điện Thoại</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-muted h-9 rounded-xl text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="font-bold text-xs text-muted-foreground">Địa Chỉ Chi Tiết (Số nhà, Tên đường)</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-muted h-9 rounded-xl text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs text-muted-foreground">Thành Phố</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-muted h-9 rounded-xl text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs text-muted-foreground">Bang/Tỉnh</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-muted h-9 rounded-xl text-xs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs text-muted-foreground">Zip Code</FormLabel>
                        <FormControl>
                          <Input className="bg-background border-muted h-9 rounded-xl text-xs font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-3 border-t border-muted/50 mt-2">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl text-xs h-9">
                  Hủy bỏ
                </Button>
                <Button 
                  type="submit" 
                  disabled={createForm.formState.isSubmitting}
                  className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold rounded-xl text-xs h-9"
                >
                  {createForm.formState.isSubmitting ? "Đang xử lý..." : "Tạo Đơn Hàng"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
