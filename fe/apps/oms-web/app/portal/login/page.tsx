'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import {
  Package,
  Loader2,
  LogIn,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/components/card'
import { Button } from '@repo/ui/components/button'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'

export default function PortalLoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/portal/dashboard')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Đang chuyển hướng...
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
        callbackUrl: '/portal/dashboard',
        basePath: '/api/auth/oms',
      })

      if (res?.error) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.')
      } else if (res?.url) {
        window.location.href = '/portal/dashboard'
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-fuchsia-400/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        <Card className="rounded-2xl shadow-xl border bg-card/85 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500" />

          <CardHeader className="space-y-1.5 text-center pt-8">
            <div className="flex justify-center mb-2">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20">
                <Package className="size-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
              Cổng Khách Hàng ShipHub
            </CardTitle>
            <CardDescription className="text-sm">
              Hệ thống Quản lý & Tạo đơn gửi hàng
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="bg-background/50 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="bg-background/50 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
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
                className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 text-white shadow-md hover:shadow-lg transition-all h-12 flex items-center justify-center gap-2 font-semibold text-sm rounded-xl mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin mr-1" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <LogIn className="size-5" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 justify-center pb-8 border-t border-muted/50 pt-5 mt-2 bg-muted/10">
            <div className="text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link href="/portal/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Đăng ký ngay
              </Link>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground/75 cursor-help hover:text-muted-foreground transition-colors">
              <HelpCircle className="size-3.5" />
              <span>Hỗ trợ kỹ thuật: support@shiphub.vn</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
