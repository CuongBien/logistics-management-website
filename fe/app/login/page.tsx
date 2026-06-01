'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import {
  Package,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-[#C41E3A]" />
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
        redirect: true,
        callbackUrl: '/',
        username,
        password,
      })
      
      if (res?.error) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.')
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#C41E3A] rounded-lg flex items-center justify-center mb-4 shadow-sm">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">BEST Inc WMS</h2>
          <p className="text-sm text-gray-500 mt-2">Hệ thống Quản lý Kho (Nội bộ)</p>
        </div>

        <Card className="border-t-4 border-t-[#C41E3A] shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Đăng nhập hệ thống</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input 
                  id="username" 
                  name="username" 
                  placeholder="admin / staff1" 
                  required 
                  disabled={loading}
                  className="focus-visible:ring-[#C41E3A]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  disabled={loading}
                  className="focus-visible:ring-[#C41E3A]"
                />
              </div>

              {error && (
                <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C41E3A] hover:bg-[#A01830] text-white h-11 mt-2"
              >
                {loading ? <Loader2 className="size-5 animate-spin" /> : 'Đăng nhập'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center pb-6">
            <div className="text-xs text-muted-foreground">
              Secured by ShipHub Identity
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
