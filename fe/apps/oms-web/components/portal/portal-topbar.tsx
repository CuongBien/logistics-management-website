'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/components/button'
import { cn } from '@repo/ui/utils'
import { Bell, Menu, Moon, Sun, User, LogOut, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { signOut, useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu'

interface PortalTopbarProps {
  onMenuClick?: () => void
}

export function PortalTopbar({ onMenuClick }: PortalTopbarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()

  const fullName = session?.user?.name || 'User'
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase()

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function handleLogout() {
    signOut({ callbackUrl: '/portal/login', basePath: '/api/auth/oms' })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
          <span className="sr-only">Mở menu</span>
        </Button>

        {/* Greeting */}
        <p className="text-sm text-muted-foreground">
          Xin chào,{' '}
          <span className="font-semibold text-foreground">{fullName}</span>{' '}
          <span className="hidden sm:inline">👋</span>
        </p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Chuyển giao diện</span>
        </Button>

        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {/* Unread dot */}
          <span
            className={cn(
              'absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500',
              'ring-2 ring-card',
            )}
          />
          <span className="sr-only">Thông báo</span>
        </Button>

        {/* User avatar with DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-1 cursor-pointer">
              <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white shadow-md">
                {initials}
              </div>
              <span className="sr-only">Tài khoản</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl">
            <DropdownMenuLabel className="font-semibold text-sm">
              Tài khoản của tôi
            </DropdownMenuLabel>
            <div className="px-2 pb-2 text-xs text-muted-foreground break-all">
              {fullName}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/portal/profile" className="flex items-center gap-2">
                <User className="size-4" /> Hồ sơ cá nhân
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/portal/profile" className="flex items-center gap-2">
                <Settings className="size-4" /> Cài đặt cửa hàng
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700 focus:text-red-700 cursor-pointer flex items-center gap-2">
              <LogOut className="size-4" /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
