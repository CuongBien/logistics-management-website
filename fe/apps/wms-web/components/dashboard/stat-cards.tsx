"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { getCapacity, getInventoryStats, getOperatorProductivity } from "@/lib/api/reports"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

interface StatCardProps {
  label: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
}

function StatCard({ label, value, change, trend }: StatCardProps) {
  const trendIcon = {
    up: <TrendingUp className="h-3 w-3 text-emerald-500" />,
    down: <TrendingDown className="h-3 w-3 text-rose-500" />,
    neutral: <Minus className="h-3 w-3 text-slate-400" />,
  }

  const trendColor = {
    up: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    down: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    neutral: "text-slate-400 bg-slate-100 border-slate-200",
  }

  return (
    <div className="bg-white border border-border p-3 flex flex-col justify-between rounded-lg shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      <div className="flex items-baseline justify-between gap-1 mt-2">
        <span className="text-lg font-extrabold text-foreground tracking-tight">{value}</span>
        {change && trend && (
          <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border ${trendColor[trend]} font-medium`}>
            {trendIcon[trend]}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function StatCards() {
  const { activeWarehouseId } = useWarehouseContext()
  const [data, setData] = useState({
    uniqueSkus: 0,
    totalQty: 0,
    totalBins: 0,
    emptyBins: 0,
    occupancyRate: 0,
    activeWorkers: 0,
    fullBins: 0,
    occupiedBins: 0
  })

  useEffect(() => {
    if (activeWarehouseId) {
      Promise.all([
        getCapacity(activeWarehouseId),
        getInventoryStats(activeWarehouseId),
        getOperatorProductivity(activeWarehouseId)
      ]).then(([capacity, stats, productivity]) => {
        setData({
          uniqueSkus: stats.totalUniqueSkus || 0,
          totalQty: stats.totalPhysicalQuantity || 0,
          totalBins: capacity.totalBins || 0,
          emptyBins: capacity.emptyBins || 0,
          occupancyRate: capacity.occupancyRate || 0,
          activeWorkers: (productivity || []).length,
          fullBins: capacity.fullBins || 0,
          occupiedBins: capacity.occupiedBins || 0
        })
      }).catch(console.error)
    }
  }, [activeWarehouseId])

  const stats: StatCardProps[] = [
    { label: "Unique SKUs", value: data.uniqueSkus.toString(), change: "Active", trend: "up" },
    { label: "Physical Qty", value: data.totalQty.toLocaleString(), change: "+5% vs ledger", trend: "up" },
    { label: "Total Bins", value: data.totalBins.toString(), change: "Standard", trend: "neutral" },
    { label: "Empty Bins", value: data.emptyBins.toString(), change: "Available", trend: "up" },
    { label: "Occupancy Rate", value: `${data.occupancyRate}%`, change: "Optimal", trend: "neutral" },
    { label: "Full Bins", value: data.fullBins.toString(), change: "At Capacity", trend: "down" },
    { label: "Occupied Bins", value: data.occupiedBins.toString(), change: "In Use", trend: "up" },
    { label: "Active Operators", value: data.activeWorkers.toString(), change: "Authorized", trend: "up" },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
