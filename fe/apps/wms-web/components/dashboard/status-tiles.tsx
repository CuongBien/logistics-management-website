"use client"

import { Clock, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface StatusTileProps {
  title: string
  count: number
  subtext: string
  color: "blue" | "yellow" | "green" | "red"
  icon: React.ReactNode
}

const colorClasses = {
  blue: "bg-[#2563EB] text-white",
  yellow: "bg-[#EAB308] text-black",
  green: "bg-[#16A34A] text-white",
  red: "bg-[#DC2626] text-white",
}

function StatusTile({ title, count, subtext, color, icon }: StatusTileProps) {
  return (
    <div className={`${colorClasses[color]} p-3 flex flex-col justify-between h-full min-h-[90px]`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide opacity-90">{title}</span>
        <span className="opacity-80">{icon}</span>
      </div>
      <div>
        <div className="text-3xl font-bold">{count}</div>
        <div className="text-xs opacity-80">{subtext}</div>
      </div>
    </div>
  )
}

import { PendingWorkloadsDto, DiscrepanciesStatsDto } from "@/lib/api/reports"

interface StatusTilesProps {
  workloads?: PendingWorkloadsDto | null;
  discrepancies?: DiscrepanciesStatsDto | null;
}

export function StatusTiles({ workloads, discrepancies }: StatusTilesProps) {
  const pendingOutboundWaves = workloads?.pendingOutboundWaves || 0;
  const pendingPutaways = workloads?.pendingPutawayTasks || 0;
  const pendingInbounds = workloads?.pendingInboundReceipts || 0;
  const unresolvedInboundDiscrepancies = discrepancies?.unresolvedInboundDiscrepancies || 0;
  const unresolvedTransitDiscrepancies = discrepancies?.unresolvedTransitDiscrepancies || 0;
  const totalDiscrepancies = unresolvedInboundDiscrepancies + unresolvedTransitDiscrepancies;

  const tiles: StatusTileProps[] = [
    {
      title: "Orders Waiting",
      count: pendingOutboundWaves,
      subtext: "Đợt hàng đang chờ xử lý",
      color: "blue",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Work in Progress",
      count: pendingPutaways,
      subtext: `Chờ cất hàng: ${pendingPutaways} tác vụ`,
      color: "yellow",
      icon: <Loader2 className="h-5 w-5" />,
    },
    {
      title: "Orders Finished",
      count: pendingInbounds,
      subtext: `Phiếu nhập hàng chờ: ${pendingInbounds}`,
      color: "green",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "Problems",
      count: totalDiscrepancies,
      subtext: `${unresolvedInboundDiscrepancies} nhập kho, ${unresolvedTransitDiscrepancies} vận chuyển`,
      color: "red",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border border-border">
      {tiles.map((tile, index) => (
        <div key={tile.title} className={index < tiles.length - 1 ? "border-r border-border/30" : ""}>
          <StatusTile {...tile} />
        </div>
      ))}
    </div>
  )
}
