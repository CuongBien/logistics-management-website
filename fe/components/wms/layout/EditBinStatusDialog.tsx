"use client"

import { useState, useEffect } from "react"
import { BinDto, BinStatus } from "@/types/wms-layout"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateBinStatus } from "@/lib/api/wms-layout"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"

const formSchema = z.object({
  status: z.string().min(1, "Vui lòng chọn một trạng thái mới"),
})

interface EditBinStatusDialogProps {
  bin: BinDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function EditBinStatusDialog({ bin, open, onOpenChange, onUpdated }: EditBinStatusDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: "" },
  })

  useEffect(() => {
    if (bin) {
      form.reset({ status: bin.status })
    }
  }, [bin, form])

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
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quản Lý Ô Kệ: <span className="font-mono text-primary font-bold">{bin.binCode}</span>
          </DialogTitle>
          <DialogDescription>
            Xem mã QR và thay đổi trạng thái vận hành vật lý của ô kệ.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="qrcode" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qrcode">Mã QR</TabsTrigger>
            <TabsTrigger value="status">Trạng thái</TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="pt-2 flex justify-center">
            <QRCodeDisplay 
              value={bin.binCode} 
              title={bin.binCode} 
              subtitle="Sử dụng mã này để xác nhận vị trí" 
              size={180} 
            />
          </TabsContent>

          <TabsContent value="status" className="pt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái Ô kệ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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

                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Đóng
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {form.formState.isSubmitting ? "Đang lưu..." : "Cập nhật"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
