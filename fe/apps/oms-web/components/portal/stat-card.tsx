'use client'

import { Card } from '@repo/ui/components/card'
import { cn } from '@repo/ui/utils'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; isPositive: boolean }
  gradient?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'bg-gradient-to-r from-blue-600 to-violet-600',
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden p-0 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border">
      {/* Gradient top border */}
      <div className={cn('h-1 w-full', gradient)} />

      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Icon */}
          <div
            className={cn(
              'flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 text-blue-600 dark:from-blue-500/20 dark:to-violet-500/20 dark:text-blue-400',
            )}
          >
            <Icon className="size-5" />
          </div>

          {/* Trend */}
          {trend && (
            <div
              className={cn(
                'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                trend.isPositive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
              )}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="size-3.5" />
              ) : (
                <ArrowDownRight className="size-3.5" />
              )}
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        {/* Value & Title */}
        <div className="mt-4 space-y-1">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
