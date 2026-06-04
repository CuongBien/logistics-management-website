"use client"

import { BinStatus } from "@/types/wms-layout"
import { Badge } from "@repo/ui/components/badge"
import { cn } from "@repo/ui/utils"

interface BinStatusBadgeProps {
  status: BinStatus
  className?: string
}

export function BinStatusBadge({ status, className }: BinStatusBadgeProps) {
  let badgeStyles = ""
  let label = status

  switch (status) {
    case 'Available':
      badgeStyles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
      label = "Trống"
      break
    case 'Occupied':
      badgeStyles = "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
      label = "Có hàng"
      break
    case 'Full':
      badgeStyles = "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
      label = "Đầy kệ"
      break
    case 'Maintenance':
      badgeStyles = "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20"
      label = "Bảo trì"
      break
    case 'Locked':
      badgeStyles = "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
      label = "Đang Khóa"
      break
    case 'Disabled':
      badgeStyles = "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 hover:bg-zinc-500/20"
      label = "Vô hiệu"
      break
    default:
      badgeStyles = "bg-slate-500/10 text-slate-500 border-slate-500/20"
  }

  return (
    <Badge variant="outline" className={cn("font-medium transition-colors select-none py-0.5 px-2 rounded-full text-xs flex items-center justify-center gap-1.5", badgeStyles, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse shrink-0" />
      {label}
    </Badge>
  )
}
