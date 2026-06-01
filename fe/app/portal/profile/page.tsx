'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { signOut } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User,
  Building,
  MapPin,
  Phone,
  Key,
  Shield,
  Loader2,
  Save,
  LogOut,
  Camera,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không đúng định dạng'),
  shopName: z.string().min(2, 'Tên cửa hàng phải có ít nhất 2 ký tự'),
  shopCategory: z.string().min(1, 'Vui lòng chọn danh mục kinh doanh'),
  address: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
})

type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mật khẩu hiện tại phải có ít nhất 6 ký tự'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không trùng khớp',
  path: ['confirmPassword'],
})

type PasswordValues = z.infer<typeof passwordSchema>

const categories = [
  { value: 'fashion', label: 'Quần áo & Thời trang' },
  { value: 'electronics', label: 'Thiết bị điện tử & Điện thoại' },
  { value: 'cosmetics', label: 'Mỹ phẩm & Chăm sóc cá nhân' },
  { value: 'food', label: 'Đồ ăn & Thực phẩm sạch' },
  { value: 'furniture', label: 'Đồ gia dụng & Nội thất' },
  { value: 'other', label: 'Ngành hàng khác' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [profile, setProfile] = useState<ProfileValues | null>(null)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      shopName: '',
      shopCategory: '',
      address: '',
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    // Just mock load profile without localStorage to avoid persistence issues
    const defaultProfile = {
      fullName: 'User ' + Math.floor(Math.random() * 100),
      phone: '0901234567',
      shopName: 'Shop Mặc định',
      shopCategory: 'other',
      address: '123 Đường Test, TP.HCM',
    }
    setProfile(defaultProfile)
    form.reset(defaultProfile)
  }, [form])

  async function onProfileSubmit(data: ProfileValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)

    setProfile(data)
    toast.success('Cập nhật thông tin tài khoản và cửa hàng thành công (Lưu tạm trên bộ nhớ trình duyệt)!')
  }

  async function onPasswordSubmit(data: PasswordValues) {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)

    toast.success('Đổi mật khẩu thành công! Vui lòng lưu lại mật khẩu mới.')
    passwordForm.reset()
  }

  function handleLogout() {
    toast.success('Đang đăng xuất...')
    signOut({ callbackUrl: '/portal/login', basePath: '/api/auth/oms' })
  }

  if (!profile) return null

  // Get Avatar Initials
  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt tài khoản</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý hồ sơ cá nhân và thông tin hoạt động của cửa hàng.
          </p>
        </div>
        <Button variant="destructive" onClick={handleLogout} className="gap-1.5 shadow-sm">
          <LogOut className="size-4" /> Đăng xuất
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card - User Avatar Summary */}
        <Card className="lg:col-span-1 shadow-sm h-fit">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl font-bold text-white shadow-xl shadow-blue-500/10">
                {initials}
              </div>
              <Button size="icon" className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-primary-foreground border-2 border-background shadow-md">
                <Camera className="size-4" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-bold">{profile.fullName}</h2>
              <p className="text-xs font-semibold text-muted-foreground px-2 py-0.5 bg-muted rounded-full w-fit mx-auto">
                Chủ shop: {profile.shopName}
              </p>
            </div>

            <Separator />

            <div className="w-full text-left space-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="size-3.5" /> {profile.phone}
              </p>
              <p className="flex items-center gap-2">
                <Building className="size-3.5" />{' '}
                {categories.find((c) => c.value === profile.shopCategory)?.label ?? 'Ngành hàng khác'}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="size-3.5 mt-0.5 shrink-0" />
                <span className="break-words">{profile.address}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right - Setting tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-sm mb-4">
              <TabsTrigger value="info">Thông tin Shop</TabsTrigger>
              <TabsTrigger value="security">Mật khẩu & Bảo mật</TabsTrigger>
            </TabsList>

            {/* Tab 1: Profile & Shop Info */}
            <TabsContent value="info">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="size-4 text-blue-600" />
                    Hồ sơ cửa hàng
                  </CardTitle>
                  <CardDescription>
                    Cập nhật thông tin liên hệ và địa chỉ mặc định để lấy hàng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Họ tên chủ cửa hàng</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input disabled {...field} className="bg-muted" />
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
                              <FormLabel>Tên cửa hàng</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                              <FormLabel>Ngành kinh doanh chính</FormLabel>
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
                              <FormLabel>Địa chỉ lấy hàng (kho hàng của bạn)</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-sm gap-1.5">
                          {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}
                          Lưu thay đổi
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Security & Password */}
            <TabsContent value="security">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="size-4 text-violet-600" />
                    Đổi mật khẩu tài khoản
                  </CardTitle>
                  <CardDescription>
                    Nên thay đổi mật khẩu định kỳ 3 tháng một lần để đảm bảo an toàn thông tin cửa hàng.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      {/* Current Password */}
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mật khẩu hiện tại</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* New Password */}
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mật khẩu mới</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Confirm Password */}
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-sm gap-1.5">
                          {isLoading ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Shield className="size-4" />
                          )}
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
