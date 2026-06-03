import React from "react"
import { Printer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"
import type { OrderDto } from "@/types/oms"

export function ShippingLabelDialog({ order }: { order: OrderDto }) {
  const handlePrintLabel = () => {
    const printContent = document.getElementById("shipping-label-print-area")
    if (!printContent) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>In Tem Vận Đơn - ${order.waybillCode}</title>
          <style>
            @page { margin: 0; size: 100mm 150mm; }
            body { font-family: "Inter", sans-serif; padding: 20px; margin: 0; background: #fff; color: #000; }
            .label-wrapper { border: 2px solid #000; border-radius: 8px; padding: 16px; max-width: 400px; margin: 0 auto; box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #000; padding-bottom: 12px; margin-bottom: 16px; }
            .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0; text-transform: uppercase; }
            .waybill { font-family: monospace; font-size: 18px; font-weight: bold; margin: 0; text-align: right; }
            .date { font-size: 10px; color: #555; text-align: right; margin: 0; }
            .info-grid { display: flex; gap: 12px; margin-bottom: 16px; }
            .info-box { border: 1px solid #000; border-radius: 4px; padding: 8px; flex: 1; }
            .info-label { font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #555; }
            .info-name { font-size: 14px; font-weight: bold; margin: 0 0 4px 0; }
            .info-text { font-size: 11px; margin: 0 0 2px 0; }
            .qr-section { text-align: center; margin: 20px 0; }
            .qr-wrapper { display: inline-block; padding: 10px; border: 2px solid #000; border-radius: 8px; }
            .qr-wrapper svg { width: 140px; height: 140px; display: block; }
            .footer { display: flex; justify-content: space-between; border-top: 2px dashed #000; padding-top: 12px; }
            .footer-item { flex: 1; }
            .footer-item.right { text-align: right; }
            .footer-label { font-size: 10px; color: #555; margin: 0 0 4px 0; }
            .footer-value { font-size: 18px; font-weight: bold; margin: 0; }
          </style>
        </head>
        <body>
          <div class="label-wrapper">
            <div class="header">
              <h1 class="logo">BEST Inc</h1>
              <div>
                <p class="waybill">${order.waybillCode}</p>
                <p class="date">${new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
            
            <div class="info-grid">
              <div class="info-box">
                <p class="info-label">Người gửi</p>
                <p class="info-name">Khách hàng / Shop</p>
                <p class="info-text">SĐT: Đang cập nhật</p>
              </div>
              <div class="info-box">
                <p class="info-label">Người nhận</p>
                <p class="info-name">${order.consigneeName}</p>
                <p class="info-text">SĐT: Đang cập nhật</p>
                <p class="info-text">${order.consigneeCity || ''}</p>
              </div>
            </div>

            <div class="qr-section">
              <p class="info-label" style="margin-bottom:8px">Mã quét vận hành (Quét tại Hub)</p>
              <div class="qr-wrapper">
                ${document.querySelector('#qr-svg-container svg')?.outerHTML || '<p>QR Code</p>'}
              </div>
            </div>

            <div class="footer">
              <div class="footer-item">
                <p class="footer-label">THU HỘ (COD)</p>
                <p class="footer-value">${new Intl.NumberFormat('vi-VN').format(order.codAmount)}₫</p>
              </div>
              <div class="footer-item right">
                <p class="footer-label">TRỌNG LƯỢNG</p>
                <p class="footer-value">${order.totalWeight} kg</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 300); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
          <Printer className="size-4" /> In Tem Vận Đơn
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gray-50">
        <DialogHeader>
          <DialogTitle>Tem Vận Đơn - {order.waybillCode}</DialogTitle>
        </DialogHeader>

        <div className="bg-white p-5 border rounded-xl shadow-sm relative overflow-hidden" id="shipping-label-print-area">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-xl font-black tracking-tighter text-blue-900">BEST Inc</h2>
            <div className="text-right">
              <p className="font-mono text-lg font-bold">{order.waybillCode}</p>
              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-blue-100 bg-blue-50/30 p-3 rounded-lg">
              <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Từ (Người gửi)</p>
              <p className="text-sm font-bold">Khách hàng / Shop</p>
              <p className="text-xs text-muted-foreground mt-1">SĐT: Đang cập nhật</p>
            </div>
            <div className="border border-indigo-100 bg-indigo-50/30 p-3 rounded-lg">
              <p className="text-[10px] font-semibold text-indigo-600 uppercase mb-1">Đến (Người nhận)</p>
              <p className="text-sm font-bold">{order.consigneeName}</p>
              <p className="text-xs text-muted-foreground mt-1">SĐT: Đang cập nhật</p>
              <p className="text-xs text-muted-foreground truncate">{order.consigneeCity}</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center mb-6 bg-white p-4 rounded-xl border border-dashed border-gray-300">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Mã quét vận hành</p>
            <div id="qr-svg-container" className="pointer-events-none">
              <QRCodeDisplay 
                value={order.id} 
                title="" 
                subtitle=""
                size={140} 
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center">Dùng máy quét mã vạch để quét dải QR này khi lấy hàng và nhập kho.</p>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase mb-1">Thu hộ (COD)</p>
              <p className="font-bold text-xl text-red-600">{new Intl.NumberFormat('vi-VN').format(order.codAmount)}₫</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs font-medium uppercase mb-1">Trọng lượng</p>
              <p className="font-semibold text-lg">{order.totalWeight} kg</p>
            </div>
          </div>
        </div>

        <Button onClick={handlePrintLabel} className="w-full mt-2" size="lg">
          <Printer className="size-4 mr-2" /> Tiến hành In Giấy
        </Button>
      </DialogContent>
    </Dialog>
  )
}
