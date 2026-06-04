"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { OutboundReturnDto } from "@/types/wms-outbound"
import { processDisposition } from "@/lib/api/wms-outbound"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ClipboardCheck, Heart, HeartCrack, Loader2 } from "lucide-react"
import { toast } from "sonner"

const dispositionFormSchema = z.object({
  condition: z.enum(["Good", "Damaged"] as const, {
    required_error: "Vui lòng kiểm định tình trạng sản phẩm vật lý",
  }),
  disposition: z.enum(["Restocked", "Scrapped", "Penalized"] as const, {
    required_error: "Vui lòng chọn quyết định xử lý hàng hóa",
  }),
  notes: z.string().min(5, "Ghi chú kiểm tra bắt buộc phải nhập tối thiểu 5 ký tự"),
})

type DispositionFormValues = z.infer<typeof dispositionFormSchema>

interface DispositionFormProps {
  isOpen: boolean
  onClose: () => void
  selectedReturn: OutboundReturnDto | null
  onSuccess: () => void
}

export function DispositionForm({ isOpen, onClose, selectedReturn, onSuccess }: DispositionFormProps) {
  const { activeWarehouseId } = useWarehouseContext()
  const form = useForm<DispositionFormValues>({
    resolver: zodResolver(dispositionFormSchema),
    defaultValues: {
      condition: "Good",
      disposition: "Restocked",
      notes: "",
    },
  })

  // Synchronize initial values when selected return changes
  useEffect(() => {
    if (selectedReturn) {
      form.reset({
        condition: selectedReturn.condition,
        disposition: selectedReturn.condition === "Good" ? "Restocked" : "Scrapped",
        notes: "",
      })
    }
  }, [selectedReturn, form])

  // Automatically adjust recommended disposition when condition changes
  const conditionValue = form.watch("condition")
  useEffect(() => {
    if (conditionValue === "Good") {
      form.setValue("disposition", "Restocked")
    } else if (conditionValue === "Damaged") {
      form.setValue("disposition", "Scrapped")
    }
  }, [conditionValue, form])

  const onSubmit = async (values: DispositionFormValues) => {
    if (!selectedReturn) return
    try {
      // In a real database, we would also update the physical condition if changed.
      // Here we invoke our mock API service
      const res = await processDisposition(selectedReturn.id, values.disposition, activeWarehouseId || "", values.notes)
      if (res.success) {
        let actionLabel = ""
        switch (values.disposition) {
          case "Restocked": actionLabel = "Nhập lại kho"; break;
          case "Scrapped": actionLabel = "Tiêu hủy"; break;
          case "Penalized": actionLabel = "Phạt đền bồi bưu tá/khách"; break;
        }
        toast.success(`Đã phân loại thành công lô hoàn trả thuộc đơn xuất ${selectedReturn.orderNo}. Phương án: ${actionLabel}`)
        onSuccess()
        onClose()
      }
    } catch (e: any) {
      toast.error(e.message || "Xử lý kiểm định thất bại")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-card border border-muted shadow-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-extrabold text-lg">
            <ClipboardCheck className="h-5 w-5 text-indigo-500" />
            Đánh Giá & Phân Loại Hàng Hoàn
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            Tiến hành kiểm nghiệm vật lý lô hàng bị hoàn trả từ đơn xuất <span className="font-mono font-bold text-primary">{selectedReturn?.orderNo}</span>.
          </DialogDescription>
        </DialogHeader>

        {selectedReturn && (
          <div className="bg-muted/40 border border-muted/60 p-3.5 rounded-xl text-xs space-y-1.5 mb-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU Sản phẩm:</span>
              <span className="font-bold font-mono text-foreground">{selectedReturn.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số lượng trả về:</span>
              <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">{selectedReturn.returnedQty}</span>
            </div>
            {selectedReturn.notes && (
              <div className="border-t border-muted/50 pt-1.5 mt-1.5">
                <span className="text-muted-foreground block font-semibold mb-0.5">Ghi chú bưu tá RTO:</span>
                <p className="italic text-muted-foreground text-[11px] leading-relaxed">{selectedReturn.notes}</p>
              </div>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Condition radio-group assessment */}
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Tình Trạng Thực Tế (Condition)
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div>
                        <RadioGroupItem value="Good" id="cond-good" className="peer sr-only" />
                        <Label
                          htmlFor="cond-good"
                          className="flex items-center justify-center gap-1.5 border border-muted rounded-xl p-2.5 cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-emerald-500 peer-data-[state=checked]:bg-emerald-500/10 peer-data-[state=checked]:text-emerald-600 dark:peer-data-[state=checked]:text-emerald-400 transition-all font-semibold text-xs text-center"
                        >
                          <Heart className="h-3.5 w-3.5 fill-emerald-500 stroke-emerald-500" />
                          Hàng Tốt (Good)
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="Damaged" id="cond-damaged" className="peer sr-only" />
                        <Label
                          htmlFor="cond-damaged"
                          className="flex items-center justify-center gap-1.5 border border-muted rounded-xl p-2.5 cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-rose-500 peer-data-[state=checked]:bg-rose-500/10 peer-data-[state=checked]:text-rose-600 dark:peer-data-[state=checked]:text-rose-400 transition-all font-semibold text-xs text-center"
                        >
                          <HeartCrack className="h-3.5 w-3.5 fill-rose-500 stroke-rose-500" />
                          Hỏng Hóc (Damaged)
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Disposition action selection */}
            <FormField
              control={form.control}
              name="disposition"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Quyết Định Xử Lý (Disposition)
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-muted h-9 rounded-xl text-xs">
                        <SelectValue placeholder="Chọn phương án cất/hủy/phạt..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-muted rounded-xl text-xs">
                      <SelectItem value="Restocked" className="cursor-pointer text-xs">
                        Cất lại kho (Restock) - Đưa về kệ chứa
                      </SelectItem>
                      <SelectItem value="Scrapped" className="cursor-pointer text-xs">
                        Tiêu hủy (Scrap) - Ghi giảm hoàn toàn tồn kho
                      </SelectItem>
                      <SelectItem value="Penalized" className="cursor-pointer text-xs">
                        Phạt đền bồi (Penalty) - Phạt lỗi vận chuyển
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assessment Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Ghi Chú Kiểm Định Chi Tiết
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập chi tiết ngoại quan vỏ hộp, linh kiện..."
                      className="bg-background border-muted h-9 rounded-xl text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs h-9">
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs h-9"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận xử lý"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
