'use client'

import { useState, useEffect } from 'react'

import { Separator } from '@repo/ui/components/separator'
import { cn } from '@repo/ui/utils'
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Wallet,
  MapPin,
  BookUser,
  X,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Đơn hàng', href: '/orders', icon: Package },
  { label: 'Tạo đơn mới', href: '/orders/create', icon: PlusCircle },
  { label: 'Yêu cầu nhập kho', href: '/inbound-requests', icon: Warehouse },
  { label: 'Sổ địa chỉ', href: '/contacts', icon: BookUser },
  { label: 'Đối soát', href: '/reconciliation', icon: Wallet },
]

interface PortalSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function PortalSidebar({ isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const initials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'U'
    
  const fullName = session?.user?.name || 'User'
  const email = session?.user?.email || 'user@shiphub.vn'

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r transition-transform duration-300 md:translate-x-0 md:static md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Branding */}
        <div className="flex h-16 items-center justify-between px-6 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-md shadow-blue-500/20">
              <Package className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              ShipHub
            </span>
          </Link>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md hover:bg-muted md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-blue-600/10 to-violet-600/10 border-l-2 border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className={cn('size-5 shrink-0', active && 'text-blue-600 dark:text-blue-400')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Separator />

        {/* User info */}
        <div className="p-4 shrink-0">
          <Link
            href="/profile"
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/70',
              pathname === '/profile' ? 'bg-muted border-l-2 border-blue-600' : 'bg-muted/40'
            )}
          >
            {/* Avatar placeholder */}
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white shadow-md">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  )
}
