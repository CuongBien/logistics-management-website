"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  PackageOpen,
  Truck,
  Boxes,
  Warehouse,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Users,
  Layers,
  RefreshCw,
  BarChart3,
  QrCode,
  AlertTriangle,
  History,
  Scale,
  Milestone
} from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@repo/ui/utils"
import { Button } from "@repo/ui/components/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@repo/ui/components/tooltip"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/components/wms/rbac/usePermissions"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@repo/ui/components/dropdown-menu"

interface NavSubItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavGroup {
  groupLabel: string
  icon: React.ReactNode
  items: NavSubItem[]
}

const navGroups: NavGroup[] = [
  {
    groupLabel: "Tổng Quan",
    icon: <LayoutDashboard className="h-4 w-4" />,
    items: [
      { label: "Dashboard", href: "/wms", icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: "Orders (OMS)", href: "/orders", icon: <ShoppingCart className="h-4 w-4" /> },
      { label: "Scanner (QR)", href: "/wms/scanner", icon: <QrCode className="h-4 w-4" /> },
      { label: "Reports", href: "/reports", icon: <BarChart3 className="h-4 w-4" /> },
    ]
  },
  {
    groupLabel: "Nhập Kho (Inbound)",
    icon: <PackageOpen className="h-4 w-4" />,
    items: [
      { label: "Receipts", href: "/wms/inbound/receipts", icon: <PackageOpen className="h-4 w-4" /> },
      { label: "Discrepancies", href: "/wms/inbound/discrepancies", icon: <AlertTriangle className="h-4 w-4" /> },
      { label: "Internal Tasks", href: "/wms/tasks/putaway", icon: <ClipboardList className="h-4 w-4" /> },
    ]
  },
  {
    groupLabel: "Xuất Kho (Outbound)",
    icon: <Truck className="h-4 w-4" />,
    items: [
      { label: "Outbound Orders", href: "/wms/outbound/orders", icon: <Truck className="h-4 w-4" /> },
      { label: "Wave Planning", href: "/wms/outbound/waves", icon: <Layers className="h-4 w-4" /> },
      { label: "Returns & RTO", href: "/wms/outbound/returns", icon: <RefreshCw className="h-4 w-4" /> },
    ]
  },
  {
    groupLabel: "Tồn Kho (Inventory)",
    icon: <Boxes className="h-4 w-4" />,
    items: [
      { label: "Inventory Stock", href: "/wms/inventory", icon: <Boxes className="h-4 w-4" /> },
      { label: "Inventory Ledger", href: "/wms/inventory/ledger", icon: <History className="h-4 w-4" /> },
      { label: "Reconciliation", href: "/wms/inventory/reconcile", icon: <Scale className="h-4 w-4" /> },
    ]
  },
  {
    groupLabel: "Cấu Hình & Sơ Đồ",
    icon: <Warehouse className="h-4 w-4" />,
    items: [
      { label: "Warehouse Layout", href: "/wms/layout", icon: <Warehouse className="h-4 w-4" /> },
      { label: "Routing Matrix", href: "/wms/layout/routes", icon: <Milestone className="h-4 w-4" /> },
    ]
  },
  {
    groupLabel: "Hệ Thống WMS",
    icon: <Settings className="h-4 w-4" />,
    items: [
      { label: "Master Data", href: "/masterdata", icon: <Users className="h-4 w-4" /> },
      { label: "Staff Management", href: "/wms/staff", icon: <Users className="h-4 w-4" /> },
      { label: "Role Management", href: "/wms/roles", icon: <Settings className="h-4 w-4" /> },
    ]
  }
]

const bottomItems: NavSubItem[] = [
  { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
]

export function SidebarNav() {
  const pathname = usePathname()
  // User wants navbar to be more compact, so we make it collapsed by default or always act like it
  // Actually, let's keep the option to expand but use hover menus always?
  // User said: "tôi thấy navbar giờ bị dài quá rồi, tôi muốn gọn lại, ví dụ chia theo nhóm, di vào thì hiện ra thêm để chọn"
  // This means they want the menu to ONLY expand on hover. We'll enforce a thin sidebar.
  const [collapsed, setCollapsed] = useState(true)
  const { data: session } = useSession()
  const { hasPermission, hasPermissionInAnyWarehouse, hasWmsAccess } = usePermissions()
  const { activeWarehouseId } = useWarehouseContext()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    if (pathname === href) return true
    
    const allHrefs = [
      ...navGroups.flatMap(g => g.items.map(i => i.href)),
      ...bottomItems.map(i => i.href)
    ]
    
    if (pathname?.startsWith(href)) {
      const hasBetterMatch = allHrefs.some(otherHref => 
        otherHref !== href && 
        otherHref.length > href.length && 
        pathname.startsWith(otherHref)
      )
      return !hasBetterMatch
    }
    return false
  }

  // Track accordion states for each group
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialStates: Record<string, boolean> = {}
    navGroups.forEach(group => {
      // Open group by default if it contains the active item
      const hasActiveChild = group.items.some(item => isActive(item.href))
      initialStates[group.groupLabel] = hasActiveChild
    })
    
    // Fallback: If no group is active, open the first group
    const hasAnyActive = Object.values(initialStates).some(v => v)
    if (!hasAnyActive && navGroups.length > 0) {
      initialStates[navGroups[0].groupLabel] = true
    }
    return initialStates
  })

  // Sync open states when route changes
  useEffect(() => {
    navGroups.forEach(group => {
      const hasActiveChild = group.items.some(item => isActive(item.href))
      if (hasActiveChild) {
        setOpenGroups(prev => ({
          ...prev,
          [group.groupLabel]: true
        }))
      }
    })
  }, [pathname])

  const toggleGroup = (groupLabel: string) => {
    setOpenGroups(prev => {
      const newState: Record<string, boolean> = {}
      // Accordion effect: Close other groups when opening one
      const wasOpen = prev[groupLabel]
      Object.keys(prev).forEach(key => {
        newState[key] = key === groupLabel ? !wasOpen : false
      })
      return newState
    })
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col sticky top-0 h-screen bg-[#1a1a2e] border-r border-[#16213e] transition-all duration-300 ease-in-out select-none z-40",
          collapsed ? "w-[4.5rem]" : "w-56"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-[#16213e] shrink-0">
          {!collapsed && (
            <span className="text-sm font-bold text-white/90 tracking-wide pl-1.5 flex items-center gap-2">
              <Warehouse className="h-4.5 w-4.5 text-[#C41E3A]" />
              LMS Portal
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-7 w-7 text-white/50 hover:text-white hover:bg-white/10 ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Main nav groups */}
        <nav className="flex-1 py-3 px-2 space-y-3 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => {
            // Hide WMS groups if user has no WMS access
            if (!hasWmsAccess && group.groupLabel !== "Tổng Quan") return null;

            // Filter out items based on user role manage permissions
            const visibleItems = group.items.filter(item => {
              if (item.href === "/wms/staff" || item.href === "/wms/roles") {
                return activeWarehouseId ? hasPermission("role:manage", activeWarehouseId) : false
              }
              return true
            })

            if (visibleItems.length === 0) return null

            // We apply the Hover Flyout Menu style for ALL modes to keep it compact,
            // or just rely on the collapsed state. Since we set collapsed=true by default,
            // the user gets exactly what they asked for: "di vào thì hiện ra thêm"
            if (collapsed) {
              const hasActiveChild = visibleItems.some(item => isActive(item.href))
              return (
                <DropdownMenu key={group.groupLabel}>
                  <DropdownMenuTrigger asChild>
                    <div className="relative flex justify-center py-1">
                      <button
                        className={cn(
                          "flex items-center justify-center h-9 w-9 rounded-lg transition-all duration-150 cursor-pointer focus:outline-none",
                          hasActiveChild
                            ? "bg-[#C41E3A] text-white shadow-sm shadow-[#C41E3A]/30"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {group.icon}
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    side="right" 
                    align="start" 
                    className="w-48 bg-[#1e1e30] border border-[#2b2b40] rounded-xl shadow-2xl py-2 flex flex-col z-50 text-white animate-in fade-in slide-in-from-left-2 duration-150"
                  >
                    <DropdownMenuLabel className="px-3 py-1 text-[10px] font-bold text-white/35 uppercase border-b border-white/5 mb-1.5 select-none">
                      {group.groupLabel}
                    </DropdownMenuLabel>
                    <div className="space-y-0.5 px-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {visibleItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <DropdownMenuItem key={item.href} asChild className="p-0 hover:bg-transparent focus:bg-transparent cursor-pointer">
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150 rounded w-full",
                                active
                                  ? "bg-[#C41E3A]/15 text-[#ff4d6d] font-semibold"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <span className="shrink-0 scale-90">{item.icon}</span>
                              <span className="truncate">{item.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            // Expanded Mode: Render Accordion Dropdown
            const isGroupOpen = openGroups[group.groupLabel]

            return (
              <div key={group.groupLabel} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.groupLabel)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold text-white/35 uppercase tracking-wider hover:text-white/70 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {group.icon}
                    {group.groupLabel}
                  </span>
                  {isGroupOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-white/20" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-white/20" />
                  )}
                </button>

                <div
                  className={cn(
                    "space-y-0.5 transition-all duration-300 overflow-hidden",
                    !isGroupOpen ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100 pl-4 border-l border-white/5 ml-3"
                  )}
                >
                  {visibleItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 px-2.5 py-2 text-[11px] font-medium transition-all duration-150 rounded",
                          active
                            ? "bg-[#C41E3A] text-white shadow-sm shadow-[#C41E3A]/30"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Bottom nav */}
        <div className="py-2 px-2 border-t border-[#16213e] space-y-0.5 shrink-0">
          {bottomItems.map((item) => {
            const active = isActive(item.href)
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 text-[11px] font-medium transition-all duration-150 rounded",
                  active
                    ? "bg-[#C41E3A] text-white shadow-sm shadow-[#C41E3A]/30"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                  collapsed && "justify-center px-0"
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs bg-[#1a1a2e] text-white border border-[#16213e]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}

          {/* User Profile widget */}
          {!collapsed && session?.user && (
            <div className="mt-2 px-2 py-2 border-t border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-[#C41E3A]/20 border border-[#C41E3A]/30 flex items-center justify-center text-[10px] font-bold text-[#C41E3A] shrink-0">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-[10px] text-white/80 font-bold truncate leading-tight">{session.user.name || 'User'}</span>
                  <span className="text-[8px] text-white/40 truncate leading-none mt-0.5">{session.user.email || ''}</span>
                </div>
              </div>
              {hasWmsAccess && activeWarehouseId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-6 text-[10px] bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                  onClick={() => router.push("/select-warehouse")}
                >
                  Đổi kho làm việc
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
