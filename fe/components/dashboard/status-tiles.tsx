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

export function StatusTiles() {
  const tiles: StatusTileProps[] = [
    {
      title: "Orders Waiting",
      count: 47,
      subtext: "12 urgent, 35 standard",
      color: "blue",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Work in Progress",
      count: 23,
      subtext: "8 picking, 15 packing",
      color: "yellow",
      icon: <Loader2 className="h-5 w-5" />,
    },
    {
      title: "Orders Finished",
      count: 156,
      subtext: "Today: +42 completed",
      color: "green",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      title: "Problems",
      count: 5,
      subtext: "3 stock issues, 2 delays",
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
