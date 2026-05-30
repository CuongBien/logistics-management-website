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
  ClipboardList,
  GitMerge,
  Users,
  Layers,
  RefreshCw
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Orders", href: "/orders", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Inbound", href: "/wms/inbound/receipts", icon: <PackageOpen className="h-4 w-4" /> },
  { label: "Outbound", href: "/wms/outbound/orders", icon: <Truck className="h-4 w-4" /> },
  { label: "Wave Planning", href: "/wms/outbound/waves", icon: <Layers className="h-4 w-4" /> },
  { label: "Returns & RTO", href: "/wms/outbound/returns", icon: <RefreshCw className="h-4 w-4" /> },
  { label: "Inventory", href: "/wms/inventory", icon: <Boxes className="h-4 w-4" /> },
  { label: "Warehouse Layout", href: "/wms/layout", icon: <Warehouse className="h-4 w-4" /> },
  { label: "Internal Tasks", href: "/wms/tasks/putaway", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Master Data", href: "/master-data/items", icon: <Users className="h-4 w-4" /> },
]

const bottomItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: <Settings className="h-4 w-4" /> },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-[#1a1a2e] border-r border-[#16213e] transition-all duration-300 ease-in-out",
          collapsed ? "w-14" : "w-52"
        )}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-12 px-3 border-b border-[#16213e]">
          {!collapsed && (
            <span className="text-sm font-bold text-white/90 tracking-wide">
              LMS
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

        {/* Main nav */}
        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 text-xs font-medium transition-all duration-150",
                  active
                    ? "bg-[#C41E3A] text-white shadow-sm shadow-[#C41E3A]/30"
                    : "text-white/60 hover:text-white hover:bg-white/5",
                  collapsed && "justify-center px-0"
                )}
              >
                <span className={cn("shrink-0", active && "drop-shadow-sm")}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* Bottom nav */}
        <div className="py-2 px-2 border-t border-[#16213e] space-y-0.5">
          {bottomItems.map((item) => {
            const active = isActive(item.href)
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-2.5 py-2 text-xs font-medium transition-all duration-150",
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
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}

          {/* User */}
          {!collapsed && (
            <div className="mt-2 px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 bg-[#C41E3A]/30 flex items-center justify-center text-[10px] font-bold text-[#C41E3A]">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/80 font-medium">Admin</span>
                  <span className="text-[9px] text-white/40">Operator</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
