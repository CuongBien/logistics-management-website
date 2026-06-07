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

import { WarehouseCapacityDto, InventoryStatsDto, OperatorProductivityDto, PendingWorkloadsDto } from "@/lib/api/reports"

interface StatCardsProps {
  inventoryStats?: InventoryStatsDto | null;
  capacity?: WarehouseCapacityDto | null;
  operatorProductivity?: OperatorProductivityDto[];
  workloads?: PendingWorkloadsDto | null;
}

export function StatCards({ inventoryStats, capacity, operatorProductivity, workloads }: StatCardsProps) {
  const activeWorkersCount = operatorProductivity?.filter(op => op.completedTasksToday > 0 || op.pendingTasks > 0).length || 0;
  const occupancyRate = capacity?.occupancyRate || 0;
  const totalPhysicalQuantity = inventoryStats?.totalPhysicalQuantity || 0;
  const pendingCrossDock = workloads?.pendingCrossDockTasks || 0;

  const stats: StatCardProps[] = [
    { label: "Tổng số lượng SKU", value: inventoryStats?.totalUniqueSkus?.toString() || "0", change: "Mã hàng", trend: "neutral" },
    { label: "Tổng tồn kho vật lý", value: totalPhysicalQuantity.toLocaleString(), change: "Sản phẩm", trend: "up" },
    { label: "Tỉ lệ lấp đầy", value: `${occupancyRate}%`, change: `${capacity?.occupiedBins}/${capacity?.totalBins} kệ`, trend: "neutral" },
    { label: "Kệ còn trống", value: capacity?.emptyBins?.toString() || "0", change: "Available", trend: "up" },
    { label: "Nhân viên hoạt động", value: activeWorkersCount.toString(), change: `Tổng số: ${operatorProductivity?.length || 0}`, trend: "neutral" },
    { label: "Tác vụ cất hàng chờ", value: workloads?.pendingPutawayTasks?.toString() || "0", change: "Putaway tasks", trend: "neutral" },
    { label: "Phiếu nhập hàng chờ", value: workloads?.pendingInboundReceipts?.toString() || "0", change: "Inbounds", trend: "neutral" },
    { label: "Tác vụ trung chuyển", value: pendingCrossDock.toString(), change: "Cross-dock", trend: "neutral" },
  ]

  return (
    <div className="grid grid-cols-4 lg:grid-cols-8 gap-0">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  )
}
