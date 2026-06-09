'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Package,
  Warehouse,
  FileText,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Label } from '@repo/ui/components/label';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@repo/ui/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';

const inboundRequestSchema = z.object({
  destinationWarehouseCode: z.string().min(1, 'Vui lòng chọn kho nhận'),
  sourceWarehouseCode: z.string().optional(),
  note: z.string().optional(),
  items: z.array(
    z.object({
      skuCode: z.string().min(1, 'Vui lòng chọn hoặc nhập mã SKU'),
      quantity: z.coerce.number().min(1, 'Số lượng phải lớn hơn hoặc bằng 1'),
    })
  ).min(1, 'Yêu cầu phải có ít nhất 1 mặt hàng'),
});

type InboundRequestFormValues = z.infer<typeof inboundRequestSchema>;

interface WarehouseOption {
  id: string;
  code: string;
  name: string;
}

interface SkuOption {
  skuCode: string;
  name: string;
}

export default function CreateInboundRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [skus, setSkus] = useState<SkuOption[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const form = useForm<InboundRequestFormValues>({
    resolver: zodResolver(inboundRequestSchema),
    defaultValues: {
      destinationWarehouseCode: '',
      sourceWarehouseCode: '',
      note: '',
      items: [{ skuCode: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    async function loadMetadata() {
      try {
        setLoadingMetadata(true);
        // Fetch warehouses
        try {
          const whRes = await fetchApi<any>('wms', '/warehouse?all=true');
          const whList = whRes?.value || whRes || [];
          setWarehouses(whList);
        } catch (err) {
          console.error('Failed to fetch warehouses', err);
          // Fallback static list
          setWarehouses([
            { id: '1', code: 'WH-HP-007', name: 'Kho Hải Phòng Main' },
            { id: '2', code: 'WH-HN-002', name: 'Kho Hà Nội Express' },
            { id: '3', code: 'WH-HCM-001', name: 'Kho Hồ Chí Minh Hub' },
          ]);
        }

        // Fetch SKUs
        try {
          const skuRes = await fetchApi<any>('wms', '/inventory/skus');
          const skuList = skuRes?.value || skuRes || [];
          setSkus(skuList);
        } catch (err) {
          console.error('Failed to fetch SKUs', err);
          // Fallback static list
          setSkus([
            { skuCode: 'SKU-IPHONE15', name: 'iPhone 15 Pro Max 256GB' },
            { skuCode: 'SKU-MACBOOKM3', name: 'MacBook Pro 14 M3 16GB' },
            { skuCode: 'SKU-AIRPODSPRO', name: 'AirPods Pro Gen 2' },
          ]);
        }
      } finally {
        setLoadingMetadata(false);
      }
    }
    loadMetadata();
  }, []);

  async function onSubmit(data: InboundRequestFormValues) {
    try {
      setIsSubmitting(true);
      const payload = {
        destinationWarehouseCode: data.destinationWarehouseCode,
        sourceWarehouseCode: data.sourceWarehouseCode || data.destinationWarehouseCode,
        note: data.note || '',
        items: data.items.map((item) => ({
          skuCode: item.skuCode,
          quantity: item.quantity,
        })),
      };

      const res = await fetchApi<any>('oms', '/orders/inbound-request', {
        method: 'POST',
        body: payload,
      });

      if (res?.isSuccess || res?.value) {
        toast.success('Tạo yêu cầu nhập kho thành công!');
        router.push('/inbound/requests');
      } else {
        toast.error('Có lỗi xảy ra khi tạo yêu cầu nhập kho.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.body?.message || 'Có lỗi xảy ra khi gửi yêu cầu nhập kho.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="h-8 w-8 p-0 rounded-full">
          <Link href="/inbound/requests">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo yêu cầu nhập kho</h1>
          <p className="text-muted-foreground text-sm">
            Tạo yêu cầu gửi hàng vào kho của hệ thống Logistics
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl">
            <CardHeader className="border-b border-muted/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
                Thông tin kho & vận chuyển
              </CardTitle>
              <CardDescription>Chọn kho tiếp nhận và điền thông tin bổ sung</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="destinationWarehouseCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">Kho đích tiếp nhận</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Chọn kho nhận hàng" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.code} value={wh.code}>
                              {wh.code} - {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceWarehouseCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">Kho gửi hàng ban đầu (Không bắt buộc)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Chọn kho xuất phát (Mặc định bằng kho nhận)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.code} value={wh.code}>
                              {wh.code} - {wh.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú vận chuyển</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Số xe giao hàng, thời gian xe đến dự kiến, lưu ý khi nhận hàng..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl">
            <CardHeader className="border-b border-muted/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Danh sách hàng hóa nhập kho
              </CardTitle>
              <CardDescription>Khai báo SKU sản phẩm và số lượng tương ứng</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-end border-b border-muted/20 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">Sản phẩm (SKU)</Label>
                      <FormField
                        control={form.control}
                        name={`items.${index}.skuCode`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Chọn SKU sản phẩm" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {skus.map((sku) => (
                                  <SelectItem key={sku.skuCode} value={sku.skuCode}>
                                    {sku.skuCode} - {sku.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="mt-1" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500">Số lượng nhập</Label>
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                className="h-10"
                                placeholder="10"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="mt-1" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-10 w-10 shrink-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-10 border-dashed text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50/50 mt-2"
                onClick={() => append({ skuCode: '', quantity: 1 })}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Thêm sản phẩm
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" asChild className="h-10" disabled={isSubmitting}>
              <Link href="/inbound/requests">Hủy</Link>
            </Button>
            <Button
              type="submit"
              className="h-10 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md text-white font-medium"
              disabled={isSubmitting || loadingMetadata}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Gửi yêu cầu nhập kho'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
