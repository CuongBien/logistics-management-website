"use client"

import { useState, useEffect } from "react"
import { BinDto, BinStatus } from "@/types/wms-layout"
import { InventoryItemDto } from "@/types/wms-inventory"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBinStatus } from "@/lib/api/wms-layout"
import { getInventoryList } from "@/lib/api/wms-inventory"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Package, Calendar, MapPin } from "lucide-react"

const formSchema = z.object({
  status: z.string().min(1, "Vui lòng chọn một trạng thái mới"),
})

interface BinDetailsDialogProps {
  bin: BinDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
  isWmsAdmin: boolean
}

export function BinDetailsDialog({ bin, open, onOpenChange, onUpdated, isWmsAdmin }: BinDetailsDialogProps) {
  const [items, setItems] = useState<InventoryItemDto[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: "" },
  })

  useEffect(() => {
    if (bin && open) {
      form.reset({ status: bin.status })
      fetchItems(bin.warehouseId, bin.id)
    } else {
      setItems([])
    }
  }, [bin, open, form])

  const fetchItems = async (warehouseId: string, binId: string) => {
    setLoadingItems(true)
    try {
      const data = await getInventoryList(warehouseId, binId)
      setItems(data)
    } catch (e) {
      console.error("Failed to load inventory for bin", e)
    } finally {
      setLoadingItems(false)
    }
  }

  if (!bin) return null

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await updateBinStatus(bin.id, values.status as BinStatus)
      toast.success(`Cập nhật trạng thái ô kệ ${bin.binCode} thành công`)
      onOpenChange(false)
      onUpdated()
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Chi Tiết Ô Kệ: <span className="font-mono text-primary font-bold">{bin.binCode}</span>
          </DialogTitle>
          <DialogDescription>
            Xem thông tin hàng hóa và cập nhật trạng thái ô kệ.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Location Details Section */}
          <div className="border rounded-xl bg-slate-50/50 overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 border-b flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Định vị vật lý (Location)</h4>
            </div>
            <div className="p-4 grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Lối đi (Aisle)</p>
                <p className="text-sm font-semibold">{bin.aisle || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Kệ (Rack)</p>
                <p className="text-sm font-semibold">{bin.rack || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Tầng (Shelf)</p>
                <p className="text-sm font-semibold">{bin.shelf || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Pick Seq</p>
                <p className="text-sm font-semibold">{bin.pickSequence || 0}</p>
              </div>
            </div>
          </div>

          {/* Inventory Items Section */}
          <div className="border rounded-xl bg-slate-50/50 overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 border-b flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Hàng Hóa Trong Ô Kệ</h4>
            </div>
            
            <div className="p-0">
              {loadingItems ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center p-6 text-sm text-slate-500 italic">
                  Không có hàng hóa nào trong ô kệ này.
                </div>
              ) : (
                <div className="max-h-[200px] overflow-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white sticky top-0 border-b">
                      <tr className="text-xs text-slate-500">
                        <th className="py-2 px-3 font-medium">SKU</th>
                        <th className="py-2 px-3 font-medium">Tồn / Khả Dụng</th>
                        <th className="py-2 px-3 font-medium">Lô (Lot)</th>
                        <th className="py-2 px-3 font-medium text-right">HSD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-xs font-bold text-primary">{item.sku}</td>
                          <td className="py-2 px-3 font-semibold text-slate-700">
                            {item.quantityOnHand} <span className="text-slate-400 font-normal">/ {item.availableQuantity}</span>
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-600">{item.lotNo || '-'}</td>
                          <td className="py-2 px-3 text-xs text-right text-slate-600 flex items-center justify-end gap-1">
                            {item.expiryDate ? (
                              <>
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Edit Status Section (Admin Only) */}
          {isWmsAdmin ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-xl">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 border-b pb-2">Thay Đổi Trạng Thái</h4>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Trạng thái Ô kệ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Chọn trạng thái" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Available">Trống (Available)</SelectItem>
                          <SelectItem value="Occupied">Có hàng (Occupied)</SelectItem>
                          <SelectItem value="Full">Đầy kệ (Full)</SelectItem>
                          <SelectItem value="Locked">Đang khóa (Locked)</SelectItem>
                          <SelectItem value="Disabled">Vô hiệu hóa (Disabled)</SelectItem>
                          <SelectItem value="Maintenance">Đang bảo trì (Maintenance)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" size="sm" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {form.formState.isSubmitting ? "Đang lưu..." : "Cập nhật"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="border p-4 rounded-xl flex justify-between items-center bg-slate-50">
              <span className="text-sm font-medium text-slate-600">Trạng thái hiện tại:</span>
              <span className="text-sm font-bold text-slate-900">{bin.status}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
