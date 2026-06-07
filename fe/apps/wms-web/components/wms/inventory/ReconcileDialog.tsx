"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@repo/ui/components/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select"
import { reconcileStock } from "@/lib/api/wms-inventory"
import { InventoryItemDto } from "@/types/wms-inventory"
import { toast } from "sonner"

interface ReconcileDialogProps {
  item: InventoryItemDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const formSchema = z.object({
  actualQuantity: z.coerce.number().min(0, "Số lượng thực tế không được âm"),
  reason: z.string().min(2, "Vui lòng nhập hoặc chọn lý do điều chỉnh"),
})

export function ReconcileDialog({ item, open, onOpenChange, onSuccess }: ReconcileDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualQuantity: 0,
      reason: "",
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        actualQuantity: item.quantityOnHand,
        reason: "",
      })
    }
  }, [open, item, form])

  if (!item) return null

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await reconcileStock({
        inventoryItemId: item.id,
        actualQuantity: values.actualQuantity,
        reason: values.reason.trim(),
      })
      const diff = values.actualQuantity - item.quantityOnHand
      const sign = diff >= 0 ? "+" : ""
      toast.success(`Cân bằng kho thành công! Điều chỉnh số lượng: ${sign}${diff} cho SKU: ${item.sku}`)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Cân bằng tồn kho thất bại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cân Bằng Tồn Kho (Reconcile)</DialogTitle>
          <DialogDescription>
            Điều chỉnh lượng tồn kho vật lý sau khi phát hiện sai lệch dữ liệu hoặc sau phiên kiểm kê định kỳ (Cycle Count).
          </DialogDescription>
        </DialogHeader>

        {/* Current State Info Panel */}
        <div className="bg-muted/40 border border-muted p-3.5 rounded-xl text-sm space-y-1.5 mb-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">SKU:</span>
            <span className="font-mono font-bold text-foreground">{item.sku}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vị trí kệ (Bin):</span>
            <span className="font-bold font-mono text-primary">{item.binCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Số lượng hệ thống ghi nhận:</span>
            <span className="font-bold font-mono">{item.quantityOnHand}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Actual Qty */}
            <FormField
              control={form.control}
              name="actualQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng thực tế (Actual Quantity)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Nhập chính xác số lượng hàng hóa kiểm đếm thực tế có trên kệ.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason selection helper */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lý do điều chỉnh</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val)} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lý do có sẵn..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Kiểm kê định kỳ (Cycle Count)">Kiểm kê định kỳ (Cycle Count)</SelectItem>
                      <SelectItem value="Hàng hỏng hóc cách ly (Damaged)">Hàng hỏng hóc cách ly (Damaged)</SelectItem>
                      <SelectItem value="Sai lệch hệ thống nhập kho (Inbound discrepancy)">Sai lệch hệ thống nhập kho</SelectItem>
                      <SelectItem value="Trả hàng lỗi từ khách (Return Defect)">Trả hàng lỗi từ khách</SelectItem>
                      <SelectItem value="Khác (Ghi chi tiết)">Khác...</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* In case they choose "Khác" or want a custom reason */}
            {form.watch("reason") === "Khác (Ghi chi tiết)" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <Input 
                  placeholder="Nhập lý do cụ thể của bạn..." 
                  onChange={(e) => form.setValue("reason", e.target.value)}
                />
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                {form.formState.isSubmitting ? "Đang xử lý..." : "Xác nhận cân bằng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
