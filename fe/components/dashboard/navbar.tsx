"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function Navbar() {
  // Notification State for premium interactivity
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Lệch tồn kho kiểm kê",
      desc: "Chênh lệch 2 SKU IPHONE15PM tại ô kệ ST-ELEC-22.",
      time: "2 phút trước",
      type: "error",
      unread: true,
    },
    {
      id: 2,
      title: "Hoàn thành cất hàng",
      desc: "Nhân viên Nguyễn Văn Khoa đã cất xong lô PT-TASK-001.",
      time: "15 phút trước",
      type: "success",
      unread: true,
    },
    {
      id: 3,
      title: "Lô hàng inbound mới",
      desc: "Lô #IN-9082 đã nhập kho, chờ Quản đốc phân ô kệ.",
      time: "1 giờ trước",
      type: "info",
      unread: true,
    },
    {
      id: 4,
      title: "Yêu cầu châm hàng khẩn",
      desc: "Khu A-02 cạn SKU BIMTA-HUG-M, cần châm hàng gấp.",
      time: "3 giờ trước",
      type: "warning",
      unread: false,
    },
    {
      id: 5,
      title: "Đợt xuất hàng (Wave)",
      desc: "Đợt WAVE-2026-05 đã gom đủ sản phẩm, chờ phân xe.",
      time: "5 giờ trước",
      type: "info",
      unread: false,
    },
  ])

  // Warehouse selection state
  const [activeWarehouse, setActiveWarehouse] = useState("ATL-01")

  const unreadCount = notifications.filter(n => n.unread).length

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    toast.success("Đã đánh dấu đọc tất cả thông báo thành công!", {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      duration: 3000
    })
  }

  const handleToggleNotification = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, unread: !n.unread } : n))
    )
  }

  const handleSwitchWarehouse = (code: string, name: string) => {
    setActiveWarehouse(code)
    toast.success(`Đã chuyển vùng làm việc sang: ${name}`, {
      description: `Hệ thống WMS đã cấu hình dữ liệu cho khu vực ${code}`,
      icon: <Building2 className="h-4 w-4 text-[#C41E3A]" />,
      duration: 3000
    })
  }

  const handleSignOut = () => {
    toast.info("Đang đăng xuất khỏi hệ thống...", {
      description: "Hẹn gặp lại bạn trong phiên làm việc tiếp theo."
    })
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
                  onClick={() => handleToggleNotification(n.id)}
                  className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${n.unread ? 'bg-[#C41E3A]/5' : ''}`}
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
                      <p className={`text-xs ${n.unread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                        <Clock className="h-3 w-3" />
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-normal">
                      {n.desc}
                    </p>
                  </div>

                  {/* Read state dot indicator */}
                  {n.unread && (
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
                Quản Đốc Kho
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 bg-white border border-slate-200 shadow-2xl p-0 mr-2 rounded-lg" align="end" sideOffset={8}>
            
            {/* User Meta Summary Card */}
            <div className="p-4 bg-gradient-to-br from-[#C41E3A] to-[#A01830] text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white/20 border border-white/20 flex items-center justify-center text-sm font-bold rounded-full backdrop-blur-md">
                  AO
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight">Nguyễn Văn Admin</h4>
                  <p className="text-[10px] text-white/80 mt-0.5 font-mono">admin@best-inc.com.vn</p>
                  <span className="inline-block mt-1 text-[9px] bg-yellow-400 text-slate-900 font-bold px-1.5 py-0.5 rounded uppercase">
                    Quản đốc ATL-01
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
                {[
                  { code: "ATL-01", name: "Kho Miền Nam ATL-01" },
                  { code: "HN-02", name: "Kho Miền Bắc HN-02" },
                  { code: "DN-03", name: "Kho Miền Trung DN-03" }
                ].map((wh) => (
                  <DropdownMenuItem 
                    key={wh.code}
                    onClick={() => handleSwitchWarehouse(wh.code, wh.name)}
                    className="text-xs flex items-center justify-between text-slate-700 focus:bg-[#C41E3A]/5 focus:text-[#C41E3A] px-2 py-1.5 rounded cursor-pointer font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 opacity-60" />
                      {wh.name}
                    </span>
                    {activeWarehouse === wh.code && (
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

