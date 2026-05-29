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
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
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

const loginSchema = z.object({
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)
    // Giả lập API gọi Đăng nhập
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    // Validate user credentials (check registered custom account or default fallback)
    const savedCreds = localStorage.getItem('shiphub_credentials')
    let isMatch = false
    let userName = 'Nguyễn Văn A'

    if (savedCreds) {
      try {
        const creds = JSON.parse(savedCreds)
        if (data.phone === creds.phone && data.password === creds.password) {
          isMatch = true
          const savedProfile = localStorage.getItem('shiphub_profile')
          if (savedProfile) {
            userName = JSON.parse(savedProfile).fullName || 'Chủ shop'
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    if (!isMatch && data.phone === '0901234567' && data.password === '123456') {
      isMatch = true
    }

    if (isMatch) {
      localStorage.setItem('shiphub_auth', 'true')
      localStorage.setItem('shiphub_current_phone', data.phone)
      toast.success(`Đăng nhập thành công! Chào mừng trở lại ${userName}.`)
      router.push('/portal/dashboard')
    } else {
      toast.error('Số điện thoại hoặc mật khẩu không chính xác! Vui lòng thử lại.')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px] dark:bg-blue-900/10 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-400/20 blur-[120px] dark:bg-violet-900/10 pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-4">
        {/* Logo Back button */}
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" /> Quay lại Trang chủ WMS
          </Link>
        </div>

        <Card className="rounded-2xl shadow-xl border bg-card/85 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 to-violet-600" />
          
          <CardHeader className="space-y-1.5 text-center pt-8">
            <div className="flex justify-center mb-2">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20">
                <Package className="size-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              ShipHub Portal
            </CardTitle>
            <CardDescription>
              Đăng nhập dành cho Khách hàng / Chủ shop gửi hàng
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Login Helper */}
            <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3.5 text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Check className="size-3.5" /> Dữ liệu đăng nhập chạy thử nghiệm:
              </p>
              <p>• Số điện thoại: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">0901234567</code></p>
              <p>• Mật khẩu: <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">123456</code></p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Mật khẩu</FormLabel>
                        <Link href="#" className="text-xs text-blue-600 hover:underline">
                          Quên mật khẩu?
                        </Link>
                      </div>
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

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all pt-2.5 pb-2.5 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 text-center pb-8 pt-2">
            <div className="text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link href="/portal/register" className="font-semibold text-blue-600 hover:underline">
                Đăng ký ngay
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
