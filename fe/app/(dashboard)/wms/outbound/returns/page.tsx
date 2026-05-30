"use client"

import { useState, useEffect } from "react"
import { OutboundReturnDto } from "@/types/wms-outbound"
import { getReturns } from "@/lib/api/wms-outbound"
import { DispositionForm } from "@/components/wms/outbound/DispositionForm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, ClipboardCheck, AlertTriangle, ShieldCheck, Trash2, Heart, HeartCrack, Gavel } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export default function ReturnsDispositionPage() {
  const [returnsList, setReturnsList] = useState<OutboundReturnDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialog State
  const [dispositionOpen, setDispositionOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState<OutboundReturnDto | null>(null)

  // Fetch Returns
  const fetchReturns = async () => {
    setIsLoading(true)
    try {
      const data = await getReturns()
      setReturnsList(data)
    } catch (error) {
      toast.error("Lỗi khi tải danh sách hàng hoàn trả (RTO)")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [])

  // Open Disposition Dialog
  const openDispositionDialog = (ret: OutboundReturnDto) => {
    setSelectedReturn(ret)
    setDispositionOpen(true)
  }

  // Format Return Physical Condition Badges
  const formatCondition = (condition: OutboundReturnDto['condition']) => {
    if (condition === 'Good') {
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold"><Heart className="h-3 w-3 mr-1 text-emerald-500 fill-emerald-500" /> Hàng tốt (Good)</Badge>;
    }
    return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold"><HeartCrack className="h-3 w-3 mr-1 text-rose-500 fill-rose-500" /> Hỏng hóc (Damaged)</Badge>;
  }

  // Format Disposition Status Badges
  const formatDisposition = (disposition: OutboundReturnDto['disposition']) => {
    switch (disposition) {
      case 'Pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2.5 py-0.5 animate-pulse"><AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> Chờ kiểm định</Badge>;
      case 'Restocked':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2.5 py-0.5"><ShieldCheck className="h-3 w-3 mr-1 text-emerald-500" /> Đã nhập lại kho</Badge>;
      case 'Scrapped':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-200 font-bold px-2.5 py-0.5"><Trash2 className="h-3 w-3 mr-1 text-zinc-500" /> Đã tiêu hủy</Badge>;
      case 'Penalized':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold px-2.5 py-0.5"><Gavel className="h-3 w-3 mr-1 text-purple-500" /> Phạt đền bồi</Badge>;
      default:
        return <Badge variant="outline">{disposition}</Badge>;
    }
  }

  // KPI calculations
  const totalReturns = returnsList.length
  const pendingAssessment = returnsList.filter(r => r.disposition === 'Pending').length
  const processedRestocked = returnsList.filter(r => r.disposition === 'Restocked').length

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Page SEO Title & Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
            Quản Lý Hàng Hoàn & Phân Loại (Returns & Disposition)
          </h1>
          <p className="text-muted-foreground mt-1">
            Tiếp nhận hàng trả lại từ các bưu tá, kiểm định tình trạng sản phẩm vật lý và đưa ra quyết định cất vào kệ hàng hoặc đưa đi hủy.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReturns}
            disabled={isLoading}
            className="font-medium flex items-center gap-1.5 h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Statistics analytical widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Returns received */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Tổng số Hàng Hoàn (RTO)
            </CardTitle>
            <RefreshCw className="h-4.5 w-4.5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-foreground">
              {isLoading ? "..." : totalReturns}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Toàn bộ các kiện hàng hoàn trả đã được WMS ghi nhận.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Pending Assessment */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-amber-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Chờ Kiểm Định & Phân Loại
            </CardTitle>
            <ClipboardCheck className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
              {isLoading ? "..." : pendingAssessment}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Lô hàng hoàn đang nằm ở trạm kiểm định chờ Supervisor ra quyết định.
            </CardDescription>
          </CardContent>
        </Card>

        {/* Restocked count */}
        <Card className="hover:shadow-md transition-shadow duration-300 relative overflow-hidden bg-card/65 border-muted">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Đã Nhập Lại Kho Thành Công
            </CardTitle>
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {isLoading ? "..." : processedRestocked}
            </div>
            <CardDescription className="text-[11px] mt-1 text-muted-foreground">
              Sản phẩm có trạng thái Tốt đã được cất lại vào bins lưu trữ.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Returns List Table */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="font-bold w-[120px]">Mã Lô Hoàn</TableHead>
                <TableHead className="font-bold">Đơn Xuất Gốc</TableHead>
                <TableHead className="font-bold">Mã SKU Sản Phẩm</TableHead>
                <TableHead className="font-bold text-right w-[100px]">SL Trả</TableHead>
                <TableHead className="font-bold">Tình Trạng Hàng</TableHead>
                <TableHead className="font-bold">Quyết Định Xử Lý</TableHead>
                <TableHead className="font-bold">Thời Gian Nhận</TableHead>
                <TableHead className="font-bold text-right w-[180px]">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                    Không tìm thấy bản ghi hàng hoàn trả nào trong hệ thống.
                  </TableCell>
                </TableRow>
              ) : (
                returnsList.map((ret) => (
                  <TableRow key={ret.id} className="hover:bg-muted/15 transition-colors">
                    <TableCell className="font-mono font-bold align-middle text-xs">
                      {ret.id}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-primary align-middle">
                      {ret.orderNo}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold align-middle">
                      {ret.sku}
                    </TableCell>
                    <TableCell className="text-right font-mono font-extrabold align-middle">
                      {ret.returnedQty}
                    </TableCell>
                    <TableCell className="align-middle">
                      {formatCondition(ret.condition)}
                    </TableCell>
                    <TableCell className="align-middle">
                      {formatDisposition(ret.disposition)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground align-middle">
                      {format(new Date(ret.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right align-middle">
                      {ret.disposition === 'Pending' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDispositionDialog(ret)}
                          className="h-8 text-indigo-600 hover:bg-indigo-500/10 font-bold"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                          Đánh Giá & Xử Lý
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground pr-3 italic select-none">
                          Đã xử lý xong
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Disposition Form Dialog Component */}
      <DispositionForm
        isOpen={dispositionOpen}
        onClose={() => setDispositionOpen(false)}
        selectedReturn={selectedReturn}
        onSuccess={fetchReturns}
      />
    </div>
  )
}
