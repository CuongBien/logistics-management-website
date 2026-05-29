"use client"

import { InventoryItemDto } from "@/types/wms-inventory"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowLeftRight, Scale, ShieldCheck, ShieldAlert, History } from "lucide-react"
import Link from "next/link"

interface ReserveActionsDropdownProps {
  item: InventoryItemDto
  onAction: (action: 'transfer' | 'reconcile' | 'reserve' | 'release', item: InventoryItemDto) => void
}

export function ReserveActionsDropdown({ item, onAction }: ReserveActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted p-0 shrink-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] bg-card border border-muted shadow-md rounded-lg">
        {/* Transfer Stock */}
        <DropdownMenuItem onClick={() => onAction('transfer', item)} className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 py-2">
          <ArrowLeftRight className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Điều chuyển kệ</span>
        </DropdownMenuItem>

        {/* Reconcile Stock */}
        <DropdownMenuItem onClick={() => onAction('reconcile', item)} className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 py-2">
          <Scale className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">Cân bằng kệ</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-muted" />

        {/* Reserve Stock */}
        <DropdownMenuItem onClick={() => onAction('reserve', item)} className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 py-2" disabled={item.availableQuantity <= 0}>
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">Bảo lưu (Reserve)</span>
        </DropdownMenuItem>

        {/* Release Stock */}
        <DropdownMenuItem 
          onClick={() => onAction('release', item)} 
          className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 py-2"
          disabled={(item.quantityOnHand - item.availableQuantity) <= 0}
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" />
          <span className="text-sm font-medium">Nhả hàng (Release)</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-muted" />

        {/* View Ledger history */}
        <Link href={`/wms/inventory/${item.id}`} passHref>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-muted/70 py-2 w-full">
            <History className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">Sổ cái lịch sử</span>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
