"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  label: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
}

function StatCard({ label, value, change, trend }: StatCardProps) {
  const trendIcon = {
    up: <TrendingUp className="h-3 w-3 text-green-600" />,
    down: <TrendingDown className="h-3 w-3 text-red-600" />,
    neutral: <Minus className="h-3 w-3 text-muted-foreground" />,
  }

  const trendColor = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  }

  return (
    <div className="bg-white border border-border p-2 flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {change && trend && (
          <div className={`flex items-center gap-0.5 text-[10px] ${trendColor[trend]}`}>
            {trendIcon[trend]}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function StatCards() {
  const stats: StatCardProps[] = [
    { label: "Orders Today", value: "0", change: "0%", trend: "neutral" },
    { label: "Avg Pick Time", value: "0m", change: "0%", trend: "neutral" },
    { label: "Fill Rate", value: "0%", change: "0%", trend: "neutral" },
    { label: "On-Time Ship", value: "0%", change: "0%", trend: "neutral" },
    { label: "Active Workers", value: "0", change: "0", trend: "neutral" },
    { label: "Units Processed", value: "0", change: "0", trend: "neutral" },
    { label: "Pending QC", value: "0", change: "0", trend: "neutral" },
    { label: "Dock Utilization", value: "0%", change: "0%", trend: "neutral" },
  ]

  return (
    <div className="grid grid-cols-4 lg:grid-cols-8 gap-0">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
