"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { InboundReceiptDto, InboundReceiptStatus } from "@/types/wms-inbound"
import { getReceipt } from "@/lib/api/wms-inbound"
import { ForceCloseDialog } from "@/components/wms/inbound/ForceCloseDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Badge } from "@repo/ui/components/badge"
import { Progress } from "@repo/ui/components/progress"
import { Loader2, ArrowLeft, ClipboardList, CheckCircle2, AlertTriangle, Ban, Lock, QrCode, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { getQrImageUrl } from "@/lib/services/qrcode"

export default function ReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [receipt, setReceipt] = useState<InboundReceiptDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [forceCloseOpen, setForceCloseOpen] = useState(false)

  // QR print dialog states
  const [printQrUrl, setPrintQrUrl] = useState<string | null>(null)
  const [printQrTitle, setPrintQrTitle] = useState("")

  const loadPrintQr = async () => {
    if (!receipt) return
    try {
      const url = await getQrImageUrl('receipt', receipt.id)
      setPrintQrUrl(url)
      setPrintQrTitle(`Phiếu nhập WMS: ${receipt.receiptNo}`)
    } catch (e) {
      toast.error("Không thể sinh ảnh QR Code cho phiếu nhập này.")
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

  const fetchReceiptDetail = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const data = await getReceipt(id)
      if (data) {
        setReceipt(data)
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết phiếu nhập", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReceiptDetail()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-12 text-center border border-dashed rounded-2xl bg-card/20 min-h-[300px] space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-500 animate-bounce" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Không tìm thấy phiếu nhập kho</h3>
          <p className="text-muted-foreground text-sm mt-1">Mã ID phiếu nhập này không tồn tại hoặc đã bị hủy.</p>
        </div>
        <Button onClick={() => router.push('/wms/inbound/receipts')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  // Format Receipt Status Helper
  const formatStatus = (status: InboundReceiptStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold gap-1.5 flex items-center justify-center px-3 py-1 text-xs select-none">
            <ClipboardList className="h-3.5 w-3.5" />
            Đang Chờ (Pending)
          </Badge>
        );
      case 'PartiallyReceived':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold gap-1.5 flex items-center justify-center px-3 py-1 text-xs select-none">
            <AlertTriangle className="h-3.5 w-3.5" />
            Nhận Một Phần
          </Badge>
        );
      case 'Received':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold gap-1.5 flex items-center justify-center px-3 py-1 text-xs select-none">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã Nhận Đủ
          </Badge>
        );
      case 'Closed':
        return (
          <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-zinc-500/20 font-bold gap-1.5 flex items-center justify-center px-3 py-1 text-xs select-none">
            <Ban className="h-3.5 w-3.5" />
            Đã Đóng Phiếu
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold gap-1.5 flex items-center justify-center px-3 py-1 text-xs select-none">
            <AlertTriangle className="h-3.5 w-3.5" />
            Đã Hủy Bỏ
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Detail Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted pb-5">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/wms/inbound/receipts')}
            className="shrink-0 h-9 w-9 border-muted hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Chi Tiết Phiếu Nhập: <span className="font-mono text-primary">{receipt.receiptNo}</span>
              </h1>
              {formatStatus(receipt.status)}
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              Đối soát thông số thực tế nhận so với thông số dự kiến và xử lý đóng phiếu.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {/* Print QR button */}
          <Button
            variant="outline"
            onClick={loadPrintQr}
            className="border-muted hover:bg-muted font-bold text-xs flex items-center gap-1.5 h-9"
          >
            <QrCode className="h-4 w-4" />
            In Tem QR Code
          </Button>

          {/* Quick link to scanner */}
          <Button
            onClick={() => router.push(`/wms/scanner?receiptId=${receipt.id}&tab=actions&action=scan-receive`)}
            className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold shadow-sm flex items-center gap-1.5 h-9"
          >
            <ExternalLink className="h-4 w-4" />
            Quét Nhập Kho
          </Button>

          {/* Action Button: Force Close if PartiallyReceived */}
          {receipt.status === 'PartiallyReceived' && (
            <Button 
              onClick={() => setForceCloseOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold shrink-0 shadow-sm flex items-center gap-1.5 h-9"
            >
              <Lock className="h-4 w-4" />
              Đóng Cưỡng Chế
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: General Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-muted relative overflow-hidden bg-card shadow-sm">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-primary" />
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Thông Tin Chung
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Mã phiếu nhập
                </span>
                <span className="font-mono text-base font-extrabold text-foreground">{receipt.receiptNo}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Đơn hàng gốc (Order ID)
                </span>
                <span className="font-mono text-sm font-semibold text-foreground bg-muted px-2.5 py-1 rounded-md block truncate">
                  {receipt.orderId}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground font-semibold block uppercase tracking-wider mb-1">
                  Tiến độ tổng thể
                </span>
                <div className="flex items-center gap-2 font-bold font-mono">
                  {receipt.lines.reduce((sum, l) => sum + l.receivedQuantity, 0)}
                  <span className="text-muted-foreground font-medium">/</span>
                  {receipt.lines.reduce((sum, l) => sum + l.expectedQuantity, 0)}
                  <span className="text-xs text-muted-foreground font-medium">Sản phẩm đã nhận</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Line Items Expected vs Received with Beautiful Progress Bars */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Tiến Độ Nhận Sản Phẩm</h3>
          
          <div className="space-y-4">
            {receipt.lines.map((line) => {
              const percentage = Math.min(
                100,
                Math.round((line.receivedQuantity / line.expectedQuantity) * 100)
              )
              const isFullyReceived = line.receivedQuantity === line.expectedQuantity

              return (
                <Card 
                  key={line.id} 
                  className={`border-muted shadow-sm hover:border-primary/20 transition-all duration-300 ${
                    isFullyReceived ? "bg-emerald-500/5 dark:bg-emerald-500/10" : ""
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Line info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-base font-mono">{line.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-muted-foreground mr-1.5">Tiến độ:</span>
                        <span className={`font-mono font-bold text-sm ${isFullyReceived ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                          {line.receivedQuantity.toLocaleString()} / {line.expectedQuantity.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={percentage} 
                        className={`h-2 flex-1 ${
                          isFullyReceived 
                            ? "[&>div]:bg-emerald-500" 
                            : "[&>div]:bg-amber-500 animate-pulse"
                        }`}
                      />
                      {isFullyReceived ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-bounce" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Force Close Confirmation Popup */}
      <ForceCloseDialog 
        receipt={receipt}
        open={forceCloseOpen}
        onOpenChange={setForceCloseOpen}
        onSuccess={fetchReceiptDetail}
      />

      {/* Printable QR Code Dialog */}
      {printQrUrl && (
        <Dialog open={!!printQrUrl} onOpenChange={(open) => !open && setPrintQrUrl(null)}>
          <DialogContent className="max-w-xs w-full bg-slate-900 border-slate-800 shadow-2xl text-white">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#C41E3A]" />
            <DialogHeader className="pb-2">
              <DialogTitle className="text-sm font-bold text-slate-100">Tem Nhãn QR Code</DialogTitle>
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
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800"
                  onClick={() => setPrintQrUrl(null)}
                >
                  Đóng
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#C41E3A] hover:bg-[#a01830] text-white font-bold"
                  onClick={handlePrint}
                >
                  In Ngay (Print)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
