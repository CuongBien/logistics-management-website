'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, MapPin, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchApi } from '@/lib/api-client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form';
import { Input } from '@repo/ui/components/input';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function CreateContactPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
    },
  });

  async function onSubmit(data: ContactFormValues) {
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
        toast.success('Đã lưu địa chỉ mới thành công');
        router.push('/contacts');
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
          <Link href="/contacts">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thêm địa chỉ liên hệ mới</h1>
          <p className="text-muted-foreground">Lưu thông tin người gửi/nhận hàng vào sổ địa chỉ để sử dụng nhanh chóng</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-blue-600" />
            Thông tin liên hệ
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
                      <FormLabel>Họ và tên (hoặc Tên công ty) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Ví dụ: Nguyễn Văn A" {...field} />
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
                  <Link href="/contacts">Hủy</Link>
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
