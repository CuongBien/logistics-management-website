"use client"

import { useState } from "react"
import { Scan, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
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

interface QrActionModalProps {
  title: string
  description?: string
  actionLabel: string
  endpoint: string
  payloadTemplate: Record<string, any>
  fields: { name: string; label: string; placeholder?: string; type?: string }[]
  buttonProps?: React.ComponentProps<typeof Button>
  onSuccess?: (data: any) => void
  icon?: React.ReactNode
  suggestions?: Record<string, any>
}

export function QrActionModal({
  title,
  description,
  actionLabel,
  endpoint,
  payloadTemplate,
  fields,
  buttonProps,
  onSuccess,
  icon,
  suggestions
}: QrActionModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(() => {
        setFormData({})
        setResult(null)
      }, 300)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    for (const field of fields) {
      if (!formData[field.name]?.trim() && field.type !== 'number') { // Basic check
        toast.error(`Vui lòng nhập ${field.label}`)
        return
      }
    }

    setLoading(true)
    try {
      // Build payload
      const payload = { ...payloadTemplate }
      fields.forEach(f => {
        payload[f.name] = f.type === 'number' ? Number(formData[f.name]) : formData[f.name]?.trim()
      })

      const res = await fetchApi<any>('wms', endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (res?.isSuccess || res?.success) {
        toast.success("Thao tác thành công", {
          description: "Dữ liệu đã được cập nhật hệ thống."
        })
        setResult(res.value || res)
        if (onSuccess) onSuccess(res.value || res)
        // Optionally close after a delay or let user view result
        setTimeout(() => setOpen(false), 2000)
      } else {
        toast.error("Thao tác thất bại", {
          description: res?.error?.message || res?.message || "Lỗi không xác định từ server."
        })
      }
    } catch (err: any) {
      console.error("QR Action Error:", err)
      toast.error("Lỗi hệ thống", {
        description: err?.message || "Đã xảy ra lỗi khi gửi yêu cầu."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button {...buttonProps}>
          {icon || <Scan className="mr-2 h-4 w-4" />}
          {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon || <Scan className="h-5 w-5 text-[#C41E3A]" />}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description || "Nhập chuỗi định dạng QR để giả lập hành động quét trên PDA."}
          </DialogDescription>
        </DialogHeader>
        
        {result ? (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-emerald-700">Thành công!</h3>
            <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            {fields.map((field, idx) => {
              const suggestion = suggestions?.[field.name];
              return (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 flex justify-between items-center w-full">
                    <span>{field.label}</span>
                    {suggestion !== undefined && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, [field.name]: String(suggestion) })}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Gợi ý: {suggestion} (Nhập nhanh)
                      </button>
                    )}
                  </label>
                  <Input 
                    autoFocus={idx === 0}
                    type={field.type || 'text'}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    placeholder={field.placeholder || `Nhập mã ${field.label}...`}
                    disabled={loading}
                  />
                </div>
              );
            })}
            
            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#C41E3A] hover:bg-[#A01830]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Scan className="h-4 w-4 mr-2" />}
                Xác nhận quét
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
