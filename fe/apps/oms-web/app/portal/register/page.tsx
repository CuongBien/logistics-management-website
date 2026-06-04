'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      setLoading(false)
      return
    }
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          firstName,
          lastName,
        })
      })

      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Đã có lỗi xảy ra khi đăng ký.')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/portal/login')
        }, 3000)
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-muted/30 overflow-hidden px-4">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-green-400/20 blur-[120px] pointer-events-none" />
        <Card className="w-full max-w-md rounded-2xl shadow-xl border bg-card/85 backdrop-blur-md overflow-hidden relative text-center py-10">
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="size-16 text-green-500 animate-in zoom-in duration-500" />
            </div>
            <h2 className="text-2xl font-bold">Đăng ký thành công!</h2>
            <p className="text-muted-foreground">Tài khoản của bạn đã được tạo. Bạn sẽ được chuyển hướng đến trang đăng nhập trong giây lát...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 overflow-hidden px-4 py-12">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-fuchsia-400/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-4">
        <div className="flex items-center justify-between px-2">
          <Link href="/portal/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="size-4" /> Quay lại Đăng nhập
          </Link>
        </div>

        <Card className="rounded-2xl shadow-xl border bg-card/85 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
          
          <CardHeader className="space-y-1.5 text-center pt-8">
            <div className="flex justify-center mb-2">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20">
                <Package className="size-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              Tạo tài khoản ShipHub
            </CardTitle>
            <CardDescription>
              Điền thông tin bên dưới để bắt đầu sử dụng dịch vụ
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Họ</Label>
                  <Input id="lastName" name="lastName" placeholder="Nguyễn" required disabled={loading} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Tên</Label>
                  <Input id="firstName" name="firstName" placeholder="Văn A" required disabled={loading} className="bg-background/50" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input id="username" name="username" placeholder="nguyenvana123" required disabled={loading} className="bg-background/50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="nguyenvana@example.com" required disabled={loading} className="bg-background/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input id="password" name="password" type="password" required disabled={loading} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required disabled={loading} className="bg-background/50" />
                </div>
              </div>

              {error && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white shadow-md hover:shadow-lg transition-all h-11 mt-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Đăng ký tài khoản'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <div className="text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/portal/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
