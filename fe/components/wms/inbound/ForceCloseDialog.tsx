"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { forceCloseReceipt } from "@/lib/api/wms-inbound"
import { InboundReceiptDto } from "@/types/wms-inbound"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface ForceCloseDialogProps {
  receipt: InboundReceiptDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const formSchema = z.object({
  confirmText: z.string().refine(val => val === "XÁC NHẬN ĐÓNG", {
    message: "Vui lòng nhập chính xác cụm từ 'XÁC NHẬN ĐÓNG' để tiếp tục"
  }),
})

export function ForceCloseDialog({ receipt, open, onOpenChange, onSuccess }: ForceCloseDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { confirmText: "" },
  })

  if (!receipt) return null

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await forceCloseReceipt(receipt.id)
      toast.success(`Đóng cưỡng chế phiếu nhập ${receipt.receiptNo} thành công!`)
      onOpenChange(false)
      form.reset()
      onSuccess()
    } catch (error: any) {
      toast.error("Đóng phiếu nhập thất bại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            Đóng Cưỡng Chế Phiếu Nhập
          </DialogTitle>
          <DialogDescription>
            Đóng vĩnh viễn phiếu nhập <span className="font-mono font-bold text-foreground">{receipt.receiptNo}</span>. Hành động này sẽ chốt số lượng thực tế đã nhận và kết thúc tiến độ nhập kho.
          </DialogDescription>
        </DialogHeader>

        {/* Warning card indicator */}
        <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-xs space-y-1.5 mb-2 text-rose-600 dark:text-rose-400">
          <p className="font-bold flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            CẢNH BÁO HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Hệ thống sẽ chốt số lượng thực tế nhận được.</li>
            <li>Nếu có chênh lệch thiếu hàng, một biên bản sự cố **OS&D** sẽ được tự động kích hoạt để đối soát sau.</li>
            <li>Supplier sẽ không thể giao thêm hàng cho phiếu này nữa.</li>
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="confirmText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nhập <span className="font-mono font-extrabold text-rose-500">XÁC NHẬN ĐÓNG</span> để chốt</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập chính xác cụm từ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white">
                {form.formState.isSubmitting ? "Đang đóng..." : "Đồng ý đóng phiếu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
