"use client"

import { Bell, Settings, User, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Guest"
  
  return (
    <header className="bg-[#C41E3A] text-white h-12 flex items-center justify-between px-4 border-b border-[#A01830]">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight">BEST Inc</span>
          <span className="text-white/70 text-sm">|</span>
          <span className="text-sm text-white/90">Logistics Operations</span>
        </div>
      </div>
      
      <nav className="hidden md:flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] text-xs h-8 px-3">
          Dashboard
        </Button>
        <Button variant="ghost" size="sm" className="text-white/70 hover:bg-[#A01830] hover:text-white text-xs h-8 px-3">
          Orders
        </Button>
        <Button variant="ghost" size="sm" className="text-white/70 hover:bg-[#A01830] hover:text-white text-xs h-8 px-3">
          Inventory
        </Button>
        <Button variant="ghost" size="sm" className="text-white/70 hover:bg-[#A01830] hover:text-white text-xs h-8 px-3">
          Reports
        </Button>
      </nav>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-yellow-400 rounded-full"></span>
        </Button>
        <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-[#A01830] p-1 h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-xs text-white/80 ml-2 hidden sm:inline">{userName}</span>
      </div>
    </header>
  )
}
