'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Package,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không đúng định dạng'),
  shopName: z.string().min(2, 'Tên cửa hàng phải có ít nhất 2 ký tự'),
  shopCategory: z.string().min(1, 'Vui lòng chọn danh mục kinh doanh'),
  address: z.string().min(5, 'Địa chỉ lấy hàng phải có ít nhất 5 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không trùng khớp',
  path: ['confirmPassword'],
})

type RegisterValues = z.infer<typeof registerSchema>

const categories = [
  { value: 'fashion', label: 'Quần áo & Thời trang' },
  { value: 'electronics', label: 'Thiết bị điện tử & Điện thoại' },
  { value: 'cosmetics', label: 'Mỹ phẩm & Chăm sóc cá nhân' },
  { value: 'food', label: 'Đồ ăn & Thực phẩm sạch' },
  { value: 'furniture', label: 'Đồ gia dụng & Nội thất' },
  { value: 'other', label: 'Ngành hàng khác' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      shopName: '',
      shopCategory: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: RegisterValues) {
    setIsLoading(true)
    // Giả lập API gọi đăng ký tài khoản
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    localStorage.setItem(
      'shiphub_profile',
      JSON.stringify({
        fullName: data.fullName,
        phone: data.phone,
        shopName: data.shopName,
        shopCategory: data.shopCategory,
        address: data.address,
      })
    )

    localStorage.setItem(
      'shiphub_credentials',
      JSON.stringify({
        phone: data.phone,
        password: data.password,
      })
    )

    toast.success('Đăng ký tài khoản Shop thành công! Vui lòng đăng nhập với SĐT vừa tạo.')
    router.push('/portal/login')
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 overflow-hidden px-4 py-8">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-900/10 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-400/20 blur-[120px] dark:bg-violet-900/10 pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-4">
        {/* Back button */}
        <div className="flex items-center justify-between px-2">
          <Link href="/portal/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" /> Quay lại trang Đăng nhập
          </Link>
        </div>

        <Card className="rounded-2xl shadow-xl border bg-card/85 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-violet-600" />
          
          <CardHeader className="space-y-1 text-center pt-8">
            <div className="flex justify-center mb-2">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
                <Package className="size-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Đăng Ký Tài Khoản Shop
            </CardTitle>
            <CardDescription>
              Trở thành đối tác gửi hàng của ShipHub ngay hôm nay
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ tên chủ shop</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input placeholder="Nguyễn Văn A" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input placeholder="0901234567" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Shop Name */}
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên shop kinh doanh</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input placeholder="Shop Thời Trang A" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Shop Category */}
                  <FormField
                    control={form.control}
                    name="shopCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngành hàng kinh doanh</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn ngành hàng" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Địa chỉ lấy hàng mặc định</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh..." className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mật khẩu</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••"
                              className="pl-9 pr-9"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Xác nhận mật khẩu</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="••••••"
                              className="pl-9 pr-9"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            >
                              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all pt-2.5 pb-2.5 mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Đang đăng ký tài khoản...
                    </>
                  ) : (
                    <>
                      Đăng ký tài khoản <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 text-center pb-8 pt-2">
            <div className="text-sm text-muted-foreground">
              Đã có tài khoản Shop?{' '}
              <Link href="/portal/login" className="font-semibold text-blue-600 hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
