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
    { label: "Orders Today", value: "231", change: "+12%", trend: "up" },
    { label: "Avg Pick Time", value: "4.2m", change: "-8%", trend: "up" },
    { label: "Fill Rate", value: "98.4%", change: "+0.2%", trend: "up" },
    { label: "On-Time Ship", value: "94.1%", change: "-1.2%", trend: "down" },
    { label: "Active Workers", value: "18", change: "0", trend: "neutral" },
    { label: "Units Processed", value: "3,847", change: "+156", trend: "up" },
    { label: "Pending QC", value: "12", change: "+3", trend: "down" },
    { label: "Dock Utilization", value: "67%", change: "+5%", trend: "up" },
  ]

  return (
    <div className="grid grid-cols-4 lg:grid-cols-8 gap-0">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
