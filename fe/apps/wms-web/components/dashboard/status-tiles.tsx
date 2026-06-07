"use client"

import { useState, useEffect } from "react"
import { Clock, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { getWorkloads, getDiscrepancies } from "@/lib/api/reports"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

interface StatusTileProps {
  title: string
  count: number
  subtext: string
  color: "blue" | "yellow" | "green" | "red"
  icon: React.ReactNode
}

const colorClasses = {
  blue: "from-blue-600 to-indigo-700 text-white shadow-blue-500/10 hover:shadow-blue-500/20",
  yellow: "from-amber-500 to-amber-600 text-white shadow-amber-500/10 hover:shadow-amber-500/20",
  green: "from-emerald-600 to-teal-700 text-white shadow-emerald-500/10 hover:shadow-emerald-500/20",
  red: "from-rose-600 to-red-700 text-white shadow-rose-500/10 hover:shadow-rose-500/20",
}

function StatusTile({ title, count, subtext, color, icon }: StatusTileProps) {
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-4 flex flex-col justify-between h-full min-h-[100px] transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg rounded-lg border border-white/10`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{title}</span>
        <span className="bg-white/10 p-1.5 rounded-md backdrop-blur-sm">{icon}</span>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold tracking-tight">{count}</div>
        <div className="text-[11px] opacity-85 mt-0.5 truncate">{subtext}</div>
      </div>
    </div>
  )
}

export function StatusTiles() {
  const { activeWarehouseId } = useWarehouseContext()
  const [data, setData] = useState({
    pendingInbound: 0,
    pendingOutbound: 0,
    workInProgress: 0,
    discrepancies: 0
  })

  useEffect(() => {
    if (activeWarehouseId) {
      Promise.all([
        getWorkloads(activeWarehouseId),
        getDiscrepancies(activeWarehouseId)
      ]).then(([workloads, disc]) => {
        setData({
          pendingInbound: workloads.pendingInboundReceipts || 0,
          pendingOutbound: workloads.pendingOutboundWaves || 0,
          workInProgress: (workloads.pendingPutawayTasks || 0) + (workloads.pendingCrossDockTasks || 0),
          discrepancies: (disc.unresolvedInboundDiscrepancies || 0) + (disc.unresolvedTransitDiscrepancies || 0)
        })
      }).catch(console.error)
    }
  }, [activeWarehouseId])

  const tiles: StatusTileProps[] = [
    {
      title: "Inbound Waiting",
      count: data.pendingInbound,
      subtext: "Inbound receipts to process",
      color: "blue",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Work in Progress",
      count: data.workInProgress,
      subtext: "Putaway & Cross-dock active",
      color: "yellow",
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
    },
    {
      title: "Outbound Waiting",
      count: data.pendingOutbound,
      subtext: "Waves pending fulfillment",
      color: "green",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      title: "Problems & Discrepancies",
      count: data.discrepancies,
      subtext: "Unresolved inventory issues",
      color: "red",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((tile) => (
        <StatusTile key={tile.title} {...tile} />
      ))}
    </div>
  )
}
