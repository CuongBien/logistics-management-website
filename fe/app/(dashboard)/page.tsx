"use client"

import { useState, useEffect } from "react"
import { StatusTiles } from "@/components/dashboard/status-tiles"
import { StatCards } from "@/components/dashboard/stat-cards"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { OrderQueue } from "@/components/dashboard/order-queue"
import { WorkerStatus } from "@/components/dashboard/worker-status"
import { ZoneOverview } from "@/components/dashboard/zone-overview"

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTime = mounted ? new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }) : ""
  
  const currentDate = mounted ? new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }) : ""

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="bg-muted border-b border-border px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-foreground">Operations Dashboard</h1>
          <span className="text-[10px] text-muted-foreground">Warehouse: ATL-01</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{currentDate}</span>
          <span className="font-mono bg-foreground text-background px-2 py-0.5">{currentTime}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-2 space-y-2 overflow-auto">
        {/* Status Tiles Row */}
        <StatusTiles />
        
        {/* Stats Row */}
        <StatCards />
        
        {/* Middle Section - Zone + Worker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2">
            <ZoneOverview />
          </div>
          <div className="lg:col-span-1">
            <WorkerStatus />
          </div>
        </div>
        
        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <OrderQueue />
          <ActivityLog />
        </div>
      </div>
    </div>
  )
}
