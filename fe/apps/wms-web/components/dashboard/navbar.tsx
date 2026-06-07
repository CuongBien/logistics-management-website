"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  Settings,
  User,
  Menu,
  LogOut,
  Check,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Sparkles,
  HelpCircle,
  Lock,
  UserCheck
} from "lucide-react"
import { Button } from "@repo/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@repo/ui/components/dropdown-menu"
import { toast } from "sonner"
import { useSession, signOut } from "next-auth/react"
import { useNotifications } from "@/contexts/NotificationContext"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { getWarehouses } from "@/lib/api/wms-layout"
import { WarehouseDto } from "@/types/wms-layout"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Vừa xong"
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function Navbar() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Nguyễn Văn Admin"
  const userEmail = session?.user?.email || "admin@best-inc.com.vn"

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Warehouse selection state from context
  const { activeWarehouseId, setActiveWarehouseId } = useWarehouseContext()
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([])

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const data = await getWarehouses(false)
        setWarehouses(data || [])
      } catch (err) {
        console.error("Failed to load warehouses in Navbar:", err)
      }
    }
    loadWarehouses()
  }, [])

  const activeWh = warehouses.find(w => w.id === activeWarehouseId)
  const activeWhName = activeWh ? activeWh.name : "Chưa chọn kho"
  const activeWhCode = activeWh ? activeWh.code : "N/A"

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    toast.success("Đã đánh dấu đọc tất cả thông báo thành công!", {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      duration: 3000
    })
  }

  const handleToggleNotification = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(id)
    }
  }

  const handleSwitchWarehouse = (id: string, name: string) => {
    setActiveWarehouseId(id)
    toast.success(`Đã chuyển vùng làm việc sang: ${name}`, {
      description: `Hệ thống WMS đã cấu hình dữ liệu cho khu vực ${name}`,
      icon: <Building2 className="h-4 w-4 text-[#C41E3A]" />,
      duration: 3000
    })
  }

  const handleSignOut = () => {
    toast.info("Đang đăng xuất khỏi hệ thống...", {
      description: "Hẹn gặp lại bạn trong phiên làm việc tiếp theo."
    })
    signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="bg-[#C41E3A] text-white h-12 flex items-center justify-between px-4 border-b border-[#A01830] select-none">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8 transition-colors">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base md:text-lg tracking-tight flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-yellow-300 animate-pulse hidden sm:inline" />
            BEST Inc
          </span>
          <span className="text-white/70 text-sm">|</span>
          <span className="text-xs md:text-sm text-white/95 font-medium tracking-wide">Control Tower Operations</span>
        </div>
      </div>

      {/* Right widgets */}
      <div className="flex items-center gap-1.5">
        
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8 relative focus-visible:ring-0 focus-visible:ring-offset-0">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-yellow-400 text-[#C41E3A] font-bold text-[9px] flex items-center justify-center rounded-full border border-[#C41E3A] animate-bounce">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl p-0 mr-2 rounded-lg" align="end" sideOffset={8}>
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-lg">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-[#C41E3A]" />
                Thông báo nghiệp vụ
              </span>
              {unreadCount > 0 && (
                <Button 
                  onClick={handleMarkAllAsRead} 
                  variant="ghost" 
                  className="text-[11px] text-[#C41E3A] hover:bg-[#C41E3A]/5 hover:text-[#A01830] h-6 px-2 font-medium"
                >
                  Đọc tất cả
                </Button>
              )}
            </div>
            
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleToggleNotification(n.id, n.isRead)}
                  className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${!n.isRead ? 'bg-[#C41E3A]/5' : ''}`}
                >
                  {/* Type icon indicator */}
                  <div className="mt-0.5 shrink-0">
                    {n.type === "error" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {n.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {n.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    {n.type === "info" && <Info className="h-4 w-4 text-blue-500" />}
                  </div>
                  
                  {/* Notification text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${!n.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">
                      {n.message}
                    </p>
                  </div>

                  {/* Read state dot indicator */}
                  {!n.isRead && (
                    <div className="h-2 w-2 bg-[#C41E3A] rounded-full mt-1.5 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 text-center bg-slate-50 rounded-b-lg">
              <Button variant="ghost" className="w-full text-xs text-slate-600 hover:text-[#C41E3A] h-7 font-medium">
                Xem tất cả thông báo hệ thống
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Operational Settings Icon Button */}
        <Link href="/settings" passHref>
          <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>

        {/* User Account Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-1.5 pl-1 cursor-pointer group">
              <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8 rounded-full border border-white/20 overflow-hidden flex items-center justify-center bg-white/10 group-hover:bg-[#A01830] transition-colors focus-visible:ring-0 focus-visible:ring-offset-0">
                <User className="h-4 w-4" />
              </Button>
              <span className="text-xs text-white/90 font-medium hidden sm:inline-block tracking-wide group-hover:text-white transition-colors">
                {userName}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 bg-white border border-slate-200 shadow-2xl p-0 mr-2 rounded-lg" align="end" sideOffset={8}>
            
            {/* User Meta Summary Card */}
            <div className="p-4 bg-gradient-to-br from-[#C41E3A] to-[#A01830] text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 border border-white/20 flex items-center justify-center text-sm font-bold rounded-full backdrop-blur-md">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight">{userName}</h4>
                  <p className="text-[10px] text-white/80 mt-0.5 font-mono">{userEmail}</p>
                  <span className="inline-block mt-1 text-[9px] bg-yellow-400 text-slate-900 font-bold px-1.5 py-0.5 rounded uppercase">
                    Kho: {activeWhCode}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-1">
              
              {/* Workspace Selection Section */}
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Vùng làm việc hiện tại
              </DropdownMenuLabel>
              <DropdownMenuGroup className="px-1 space-y-0.5">
                {warehouses.map((wh) => (
                  <DropdownMenuItem 
                    key={wh.id}
                    onClick={() => handleSwitchWarehouse(wh.id, wh.name)}
                    className="text-xs flex items-center justify-between text-slate-700 focus:bg-[#C41E3A]/5 focus:text-[#C41E3A] px-2 py-1.5 rounded cursor-pointer font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 opacity-60" />
                      {wh.name}
                    </span>
                    {activeWarehouseId === wh.id && (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 font-bold" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-slate-100 my-1" />

              {/* Navigation Links */}
              <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Quản trị tài khoản
              </DropdownMenuLabel>
              
              <DropdownMenuGroup className="px-1">
                <DropdownMenuItem className="text-xs text-slate-700 focus:bg-[#C41E3A]/5 focus:text-[#C41E3A] px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 font-medium">
                  <User className="h-3.5 w-3.5 opacity-60" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>

                <Link href="/settings" className="w-full">
                  <DropdownMenuItem className="text-xs text-slate-700 focus:bg-[#C41E3A]/5 focus:text-[#C41E3A] px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 font-medium">
                    <Lock className="h-3.5 w-3.5 opacity-60" />
                    Cài đặt hệ thống
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuItem className="text-xs text-slate-700 focus:bg-[#C41E3A]/5 focus:text-[#C41E3A] px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 font-medium">
                  <HelpCircle className="h-3.5 w-3.5 opacity-60" />
                  Tài liệu hướng dẫn WMS
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-slate-100 my-1" />

              {/* Sign out */}
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-xs text-red-600 focus:bg-red-50 focus:text-red-700 px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 font-medium"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                Đăng xuất phiên làm việc
              </DropdownMenuItem>

            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
