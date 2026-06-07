'use client'

import { cn } from '@repo/ui/utils'
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
  bgColor: string
}

const statusMetaMap: Record<string, StatusMeta> = {
  New: {
    icon: CircleDot,
    label: 'Mới tạo',
    color: 'text-slate-600 dark:text-slate-400',
    dotColor: 'bg-slate-500',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
  },
  Confirmed: {
    icon: CheckCircle2,
    label: 'Đã xác nhận',
    color: 'text-sky-600 dark:text-sky-400',
    dotColor: 'bg-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-900/30',
  },
  AwaitingPickup: {
    icon: Clock,
    label: 'Chờ lấy hàng',
    color: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
  },
  PickedUp: {
    icon: PackageCheck,
    label: 'Đã lấy hàng',
    color: 'text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
  },
  AwaitingInbound: {
    icon: PackageSearch,
    label: 'Chờ nhập kho',
    color: 'text-cyan-600 dark:text-cyan-400',
    dotColor: 'bg-cyan-500',
    bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
  },
  InWarehouse: {
    icon: Warehouse,
    label: 'Trong kho',
    color: 'text-teal-600 dark:text-teal-400',
    dotColor: 'bg-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-900/30',
  },
  Sorting: {
    icon: Shuffle,
    label: 'Đang phân loại',
    color: 'text-indigo-600 dark:text-indigo-400',
    dotColor: 'bg-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
  },
  AwaitingDispatch: {
    icon: Box,
    label: 'Chờ điều phối',
    color: 'text-purple-600 dark:text-purple-400',
    dotColor: 'bg-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/30',
  },
  Dispatched: {
    icon: PackageOpen,
    label: 'Đã điều phối',
    color: 'text-violet-600 dark:text-violet-400',
    dotColor: 'bg-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-900/30',
  },
  Delivering: {
    icon: Truck,
    label: 'Đang giao hàng',
    color: 'text-orange-600 dark:text-orange-400',
    dotColor: 'bg-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/30',
  },
  Delivered: {
    icon: CheckCircle2,
    label: 'Đã giao thành công',
    color: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  Completed: {
    icon: CheckCircle2,
    label: 'Hoàn thành',
    color: 'text-green-600 dark:text-green-400',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/30',
  },
  Failed: {
    icon: XCircle,
    label: 'Giao thất bại',
    color: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
  },
  Cancelled: {
    icon: XCircle,
    label: 'Đã hủy',
    color: 'text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
    bgColor: 'bg-rose-50 dark:bg-rose-900/30',
  },
  ReturnInTransit: {
    icon: ArrowLeftRight,
    label: 'Đang hoàn trả',
    color: 'text-yellow-600 dark:text-yellow-400',
    dotColor: 'bg-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
  },
}

const defaultMeta: StatusMeta = {
  icon: CircleDot,
  label: 'Không xác định',
  color: 'text-gray-600',
  dotColor: 'bg-gray-400',
  bgColor: 'bg-gray-50',
}

function formatTimestamp(dateString: string): string {
  try {
    return format(new Date(dateString), 'HH:mm - dd/MM/yyyy')
  } catch {
    return dateString
  }
}

interface OrderTimelineProps {
  events: OrderStatusHistoryDto[]
  currentStatus: OrderStatus
}

export function OrderTimeline({ events, currentStatus }: OrderTimelineProps) {
  // Backend trả về StatusTo (trạng thái mới) và changedAtUtc
  // Sort events descending by changedAtUtc (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.changedAtUtc).getTime() - new Date(a.changedAtUtc).getTime(),
  )

  if (sortedEvents.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        Chưa có lịch sử trạng thái.
      </div>
    )
  }

  return (
    <div className="relative space-y-0">
      {sortedEvents.map((event, index) => {
        // statusTo là trạng thái của bước này
        const statusKey = event.statusTo
        const meta = statusMetaMap[statusKey] ?? defaultMeta
        const Icon = meta.icon
        const isLatest = index === 0
        const isLast = index === sortedEvents.length - 1

        return (
          <div key={`${event.statusTo}-${event.changedAtUtc}-${index}`} className="relative flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={cn(
                  'relative z-10 flex shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm',
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
            <div className={cn('pb-6 flex-1', isLast && 'pb-0')}>
              <div
                className={cn(
                  'rounded-lg px-3 py-2.5',
                  isLatest ? meta.bgColor : 'bg-transparent',
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={cn(
                      'font-semibold leading-none',
                      isLatest ? 'text-base' : 'text-sm',
                      meta.color,
                    )}
                  >
                    {meta.label}
                  </p>
                  {isLatest && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 animate-pulse">
                      Hiện tại
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {formatTimestamp(event.changedAtUtc)}
                </p>

                {event.reason && (
                  <p className="mt-1.5 text-xs text-muted-foreground/80 italic">
                    📋 {event.reason}
                  </p>
                )}

                {event.changedByOperatorId && (
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    👤 Thực hiện bởi: {event.changedByOperatorId}
                  </p>
                )}

                {!isLatest && event.statusFrom && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/40">
                    {statusMetaMap[event.statusFrom]?.label ?? event.statusFrom} → {meta.label}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
