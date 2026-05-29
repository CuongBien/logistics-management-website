'use client'

import { cn } from '@/lib/utils'
import type { OrderStatus, OrderStatusHistoryDto } from '@/types/oms'
import { format } from 'date-fns'
import {
  ArrowLeftRight,
  Box,
  CheckCircle2,
  CircleDot,
  Clock,
  PackageCheck,
  PackageOpen,
  PackageSearch,
  Shuffle,
  Truck,
  Warehouse,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

interface StatusMeta {
  icon: LucideIcon
  label: string
  color: string
  dotColor: string
}

const statusMetaMap: Record<OrderStatus, StatusMeta> = {
  New: {
    icon: CircleDot,
    label: 'Mới tạo',
    color: 'text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-500',
  },
  Confirmed: {
    icon: CheckCircle2,
    label: 'Đã xác nhận',
    color: 'text-sky-600 dark:text-sky-400',
    dotColor: 'bg-sky-500',
  },
  AwaitingPickup: {
    icon: Clock,
    label: 'Chờ lấy hàng',
    color: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  PickedUp: {
    icon: PackageCheck,
    label: 'Đã lấy hàng',
    color: 'text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
  },
  AwaitingInbound: {
    icon: PackageSearch,
    label: 'Chờ nhập kho',
    color: 'text-cyan-600 dark:text-cyan-400',
    dotColor: 'bg-cyan-500',
  },
  InWarehouse: {
    icon: Warehouse,
    label: 'Trong kho',
    color: 'text-teal-600 dark:text-teal-400',
    dotColor: 'bg-teal-500',
  },
  Sorting: {
    icon: Shuffle,
    label: 'Đang phân loại',
    color: 'text-indigo-600 dark:text-indigo-400',
    dotColor: 'bg-indigo-500',
  },
  AwaitingDispatch: {
    icon: Box,
    label: 'Chờ điều phối',
    color: 'text-purple-600 dark:text-purple-400',
    dotColor: 'bg-purple-500',
  },
  Dispatched: {
    icon: PackageOpen,
    label: 'Đã điều phối',
    color: 'text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500',
  },
  Delivering: {
    icon: Truck,
    label: 'Đang giao',
    color: 'text-orange-600 dark:text-orange-400',
    dotColor: 'bg-orange-500',
  },
  Delivered: {
    icon: CheckCircle2,
    label: 'Đã giao',
    color: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  Completed: {
    icon: CheckCircle2,
    label: 'Hoàn thành',
    color: 'text-green-600 dark:text-green-400',
    dotColor: 'bg-green-500',
  },
  Failed: {
    icon: XCircle,
    label: 'Giao thất bại',
    color: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
  },
  Cancelled: {
    icon: XCircle,
    label: 'Đã hủy',
    color: 'text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
  },
  ReturnInTransit: {
    icon: ArrowLeftRight,
    label: 'Đang hoàn trả',
    color: 'text-yellow-600 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
  },
}

function formatTimestamp(dateString: string): string {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm')
  } catch {
    return dateString
  }
}

interface OrderTimelineProps {
  events: OrderStatusHistoryDto[]
  currentStatus: OrderStatus
}

export function OrderTimeline({ events, currentStatus }: OrderTimelineProps) {
  // Sort events by changedAt descending (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  )

  return (
    <div className="relative space-y-0">
      {sortedEvents.map((event, index) => {
        const meta = statusMetaMap[event.status]
        const Icon = meta.icon
        const isLatest = index === 0
        const isLast = index === sortedEvents.length - 1

        return (
          <div key={`${event.status}-${event.changedAt}`} className="relative flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={cn(
                  'relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 border-background',
                  isLatest ? 'size-10' : 'size-7',
                  meta.dotColor,
                )}
              >
                {isLatest && (
                  <span
                    className={cn(
                      'absolute inset-0 rounded-full animate-pulse',
                      meta.dotColor,
                      'opacity-40',
                    )}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 text-white',
                    isLatest ? 'size-5' : 'size-3.5',
                  )}
                />
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="w-px flex-1 min-h-6 bg-border" />
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-8', isLast && 'pb-0')}>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'font-semibold leading-none',
                    isLatest ? 'text-base' : 'text-sm',
                    meta.color,
                  )}
                >
                  {meta.label}
                </p>
                {isLatest && event.status === currentStatus && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    Hiện tại
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatTimestamp(event.changedAt)}
              </p>

              {event.reason && (
                <p className="mt-1.5 text-sm text-muted-foreground/80 rounded-md bg-muted/50 px-3 py-1.5 border border-border/50">
                  {event.reason}
                </p>
              )}

              {event.changedBy && (
                <p className="mt-1 text-xs text-muted-foreground/60">
                  bởi {event.changedBy}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
