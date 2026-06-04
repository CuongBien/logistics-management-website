"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ItemDto } from "@/types/master-data"
import { createItem, updateItem } from "@/lib/api/master-data"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@repo/ui/components/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@repo/ui/components/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@repo/ui/components/select"
import { Input } from "@repo/ui/components/input"
import { Button } from "@repo/ui/components/button"
import { Loader2, Package } from "lucide-react"
import { toast } from "sonner"

const itemSchema = z.object({
  sku: z
    .string()
    .min(3, "Mã SKU bắt buộc tối thiểu 3 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Mã SKU chỉ gồm chữ HOA, số, dấu gạch ngang (-) hoặc gạch dưới (_)"),
  name: z.string().min(5, "Tên sản phẩm bắt buộc tối thiểu 5 ký tự"),
  weight: z
    .preprocess((val) => Number(val), z.number({ invalid_type_error: "Trọng lượng phải là số" }).positive("Trọng lượng phải lớn hơn 0")),
  length: z
    .preprocess((val) => Number(val), z.number({ invalid_type_error: "Chiều dài phải là số" }).positive("Chiều dài phải lớn hơn 0")),
  width: z
    .preprocess((val) => Number(val), z.number({ invalid_type_error: "Chiều rộng phải là số" }).positive("Chiều rộng phải lớn hơn 0")),
  height: z
    .preprocess((val) => Number(val), z.number({ invalid_type_error: "Chiều cao phải là số" }).positive("Chiều cao phải lớn hơn 0")),
  category: z.string().min(1, "Vui lòng chọn một ngành hàng"),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ItemMasterFormProps {
  isOpen: boolean
  onClose: () => void
  selectedItem: ItemDto | null
  onSuccess: () => void
}

const CATEGORIES = [
  "Điện Tử",
  "Mẹ & Bé",
  "Hàng Tiêu Dùng",
  "Thời Trang",
  "Dược Phẩm",
  "Nội Thất",
  "Thực Phẩm"
]

export function ItemMasterForm({ isOpen, onClose, selectedItem, onSuccess }: ItemMasterFormProps) {
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      sku: "",
      name: "",
      weight: 0,
      length: 0,
      width: 0,
      height: 0,
      category: "",
    },
  })

  // Pre-fill form when editing an item
  useEffect(() => {
    if (selectedItem) {
      form.reset({
        sku: selectedItem.sku,
        name: selectedItem.name,
        weight: selectedItem.weight,
        length: selectedItem.length,
        width: selectedItem.width,
        height: selectedItem.height,
        category: selectedItem.category,
      })
    } else {
      form.reset({
        sku: "",
        name: "",
        weight: 0,
        length: 0,
        width: 0,
        height: 0,
        category: "",
      })
    }
  }, [selectedItem, form, isOpen])

  const onSubmit = async (values: ItemFormValues) => {
    try {
      if (selectedItem) {
        // Edit Item
        await updateItem(selectedItem.id, values)
        toast.success(`Cập nhật sản phẩm ${values.sku} thành công!`)
      } else {
        // Create Item
        await createItem(values)
        toast.success(`Thêm mới sản phẩm ${values.sku} thành công!`)
      }
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e.message || "Lưu thông tin sản phẩm thất bại")
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[480px] bg-card border-l border-muted flex flex-col h-full shadow-2xl">
        <SheetHeader className="pb-4 border-b border-muted">
          <SheetTitle className="flex items-center gap-2 text-foreground font-extrabold text-lg">
            <Package className="h-5 w-5 text-[#C41E3A]" />
            {selectedItem ? "Chỉnh sửa sản phẩm SKU" : "Thêm mới sản phẩm SKU"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-xs">
            {selectedItem
              ? "Cập nhật các thông số kích thước vật lý và thông tin chi tiết của sản phẩm."
              : "Khởi tạo SKU mới trên hệ thống danh mục hàng hóa tổng của WMS/OMS."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* SKU Code */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Mã SKU <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: IPHONE15PM"
                        className="bg-background border-muted h-9 rounded-md text-xs uppercase"
                        disabled={!!selectedItem} // SKU is typically immutable once created
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Tên sản phẩm <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Điện thoại iPhone 15 Pro Max..."
                        className="bg-background border-muted h-9 rounded-md text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Category Select */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Danh mục ngành hàng <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-muted h-9 rounded-md text-xs">
                          <SelectValue placeholder="Chọn danh mục..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-muted rounded-md text-xs">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="cursor-pointer text-xs">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Weight */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Trọng lượng (kg) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="VD: 0.22"
                        className="bg-background border-muted h-9 rounded-md text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Dimensions Section */}
              <div className="border border-muted/50 rounded-xl p-3.5 bg-muted/20 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  Thông số kích thước (DxRxC) - Đơn vị: cm
                </h4>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* Length */}
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] uppercase text-muted-foreground font-semibold">
                          Chiều dài (L)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Dài"
                            className="bg-background border-muted h-8 rounded-md text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )}
                  />

                  {/* Width */}
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] uppercase text-muted-foreground font-semibold">
                          Chiều rộng (W)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Rộng"
                            className="bg-background border-muted h-8 rounded-md text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )}
                  />

                  {/* Height */}
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-[10px] uppercase text-muted-foreground font-semibold">
                          Chiều cao (H)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Cao"
                            className="bg-background border-muted h-8 rounded-md text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[9px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <SheetFooter className="pt-6 border-t border-muted mt-6 gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-md text-xs h-9">
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-[#C41E3A] hover:bg-[#A01830] text-white font-bold rounded-md text-xs h-9 shadow-sm"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu cấu hình"
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
