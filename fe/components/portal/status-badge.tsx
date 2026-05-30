'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types/oms'

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  New: {
    label: 'Mới tạo',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  Confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  },
  AwaitingPickup: {
    label: 'Chờ lấy hàng',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  PickedUp: {
    label: 'Đã lấy hàng',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  AwaitingInbound: {
    label: 'Chờ nhập kho',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
  InWarehouse: {
    label: 'Trong kho',
    className: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  },
  Sorting: {
    label: 'Đang phân loại',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  },
  AwaitingDispatch: {
    label: 'Chờ điều phối',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  Dispatched: {
    label: 'Đã điều phối',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  },
  Delivering: {
    label: 'Đang giao',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  Delivered: {
    label: 'Đã giao',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  Completed: {
    label: 'Hoàn thành',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  Failed: {
    label: 'Giao thất bại',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  Cancelled: {
    label: 'Đã hủy',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  },
  ReturnInTransit: {
    label: 'Đang hoàn trả',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
}

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent gap-1.5 font-medium',
        config.className,
        className,
      )}
    >
      <span className="text-[8px] leading-none">●</span>
      {config.label}
    </Badge>
  )
}
