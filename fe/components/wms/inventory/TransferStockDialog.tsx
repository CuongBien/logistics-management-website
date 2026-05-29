"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { transferStock } from "@/lib/api/wms-inventory"
import { InventoryItemDto } from "@/types/wms-inventory"
import { toast } from "sonner"

interface TransferStockDialogProps {
  item: InventoryItemDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function TransferStockDialog({ item, open, onOpenChange, onSuccess }: TransferStockDialogProps) {
  const formSchema = z.object({
    destBin: z.string().min(2, "Mã kệ đích phải có ít nhất 2 ký tự").regex(/^[A-Z0-9-]+$/, "Mã kệ chỉ chứa chữ hoa, số và dấu gạch ngang"),
    qty: z.coerce.number().min(1, "Số lượng chuyển tối thiểu là 1").max(item?.availableQuantity || 1, `Số lượng chuyển tối đa khả dụng là ${item?.availableQuantity || 0}`),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destBin: "",
      qty: 1,
    },
  })

  useEffect(() => {
    if (open && item) {
      form.reset({
        destBin: "",
        qty: 1,
      })
    }
  }, [open, item, form])

  if (!item) return null

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await transferStock({
        inventoryItemId: item.id,
        destBin: values.destBin.toUpperCase().trim(),
        qty: values.qty,
      })
      toast.success(`Đã điều chuyển ${values.qty} hàng hóa từ kệ ${item.binCode} sang kệ ${values.destBin.toUpperCase()} thành công!`)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Điều chuyển kho thất bại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Điều Chuyển Ô Kệ Vật Lý
          </DialogTitle>
          <DialogDescription>
            Di chuyển hàng hóa của SKU <span className="font-bold text-foreground font-mono">{item.sku}</span> sang vị trí kệ mới.
          </DialogDescription>
        </DialogHeader>

        {/* Source info panel */}
        <div className="bg-muted/40 border border-muted p-3.5 rounded-xl text-sm space-y-1.5 mb-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vị trí hiện tại:</span>
            <span className="font-bold font-mono text-primary">{item.binCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tồn khả dụng chuyển:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.availableQuantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mã Lô hàng (LotNo):</span>
            <span className="font-mono text-xs font-semibold">{item.lotNo || "Không có Lô"}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dest Bin */}
            <FormField
              control={form.control}
              name="destBin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vị trí kệ đích (Dest Bin)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ST-A-03, CD-B-02" {...field} />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Nhập mã ô kệ vật lý mà bạn muốn dời hàng hóa đến.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={form.control}
              name="qty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng luân chuyển</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={item.availableQuantity} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                {form.formState.isSubmitting ? "Đang xử lý..." : "Xác nhận chuyển"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
