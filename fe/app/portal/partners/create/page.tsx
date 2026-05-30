'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building, MapPin, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchApi } from '@/lib/api-client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const partnerSchema = z.object({
  name: z.string().min(2, 'Tên đối tác phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

export default function CreatePartnerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
    },
  });

  async function onSubmit(data: PartnerFormValues) {
    try {
      setSubmitting(true);
      const res = await fetchApi<{ isSuccess: boolean }>('masterdata', '/partners', {
        method: 'POST',
        body: {
          name: data.name,
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          latitude: null,
          longitude: null,
        },
      });

      if (res && res.isSuccess) {
        toast.success('Đã lưu đối tác mới thành công');
        router.push('/portal/partners');
        router.refresh();
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (error) {
      console.error('Failed to create partner', error);
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-1.5" asChild>
          <Link href="/portal/partners">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thêm đối tác mới</h1>
          <p className="text-muted-foreground">Tạo thông tin người gửi/nhận hàng vào sổ địa chỉ</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="size-4 text-emerald-600" />
            Thông tin chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Tên đối tác (Công ty / Cá nhân) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên đối tác..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Phone className="size-3 text-muted-foreground" />
                        Số điện thoại
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="09xxxx..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-muted-foreground" />
                        Tỉnh / Thành phố
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Hồ Chí Minh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Địa chỉ chi tiết</FormLabel>
                      <FormControl>
                        <Input placeholder="Số nhà, đường, phường/xã..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" asChild>
                  <Link href="/portal/partners">Hủy</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Save className="size-4 mr-2" />
                  {submitting ? 'Đang lưu...' : 'Lưu lại'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
