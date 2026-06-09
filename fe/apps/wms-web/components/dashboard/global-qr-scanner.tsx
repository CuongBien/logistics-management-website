"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Scan, Search, Loader2 } from "lucide-react"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog"
import { toast } from "sonner"
import { fetchApi } from "@/lib/api-client"

export function GlobalQrScanner() {
  const [open, setOpen] = useState(false)
  const [qrValue, setQrValue] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!qrValue.trim()) return

    setLoading(true)
    try {
      const res = await fetchApi<any>('wms', '/qrcode/parse', {
        method: 'POST',
        body: JSON.stringify({ rawValue: qrValue.trim() })
      })

      const data = res?.isSuccess ? res.value : res

      if (data?.type === "UNKNOWN" || !data?.type) {
        toast.error("Mã QR không hợp lệ", {
          description: data?.message || "Không thể nhận diện mã QR này trong hệ thống."
        })
      } else {
        toast.success(`Đã nhận diện: ${data.type}`, {
          description: "Đang chuyển hướng đến trang chi tiết..."
        })
        
        // Routing logic based on entity type
        switch (data.type) {
          case "BIN":
            if (data.entityId) router.push(`/settings/bins/${data.entityId}`)
            break
          case "ORDER":
          case "OUTBOUND_ORDER":
            if (data.entityId) router.push(`/outbound/orders/${data.entityId}`)
            break
          case "SHIPMENT":
            if (data.entityId) router.push(`/outbound/shipments/${data.entityId}`)
            break
          case "SKU":
            router.push(`/inventory/catalog?sku=${encodeURIComponent(data.data?.skuCode || "")}`)
            break
          case "RECEIPT":
            if (data.entityId) router.push(`/inbound/receipts/${data.entityId}`)
            break
          default:
            toast.info(`Mã ${data.type} hợp lệ nhưng chưa có trang hiển thị.`)
        }
        
        setOpen(false)
        setQrValue("")
      }
    } catch (err) {
      console.error("QR Parse Error:", err)
      toast.error("Lỗi hệ thống", {
        description: "Đã xảy ra lỗi khi giải mã QR."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-[#A01830] p-1 h-8 w-8 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 relative"
          title="Máy quét QR"
        >
          <Scan className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5 text-[#C41E3A]" />
            Giả lập Quét Mã QR
          </DialogTitle>
          <DialogDescription>
            Nhập chuỗi định dạng QR để test luồng. Ví dụ: <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs">BIN:STG-IN-01</code>, <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs">OB:12345</code>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleScan} className="flex items-center gap-2 mt-4">
          <Input 
            autoFocus
            value={qrValue}
            onChange={(e) => setQrValue(e.target.value)}
            placeholder="Nhập mã QR..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !qrValue.trim()} className="bg-[#C41E3A] hover:bg-[#A01830]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
