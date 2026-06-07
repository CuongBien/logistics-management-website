"use client"

import { useState, useEffect } from "react"
import { StatusTiles } from "@/components/dashboard/status-tiles"
import { StatCards } from "@/components/dashboard/stat-cards"
import { ActivityLog } from "@/components/dashboard/activity-log"
import { OrderQueue } from "@/components/dashboard/order-queue"
import { WorkerStatus } from "@/components/dashboard/worker-status"
import { ZoneOverview } from "@/components/dashboard/zone-overview"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { getWarehouses } from "@/lib/api/wms-layout"
import { 
  getCapacity, 
  getInventoryStats, 
  getWorkloads, 
  getDiscrepancies, 
  getOperatorProductivity, 
  getZoneOccupancy,
  WarehouseCapacityDto,
  InventoryStatsDto,
  PendingWorkloadsDto,
  DiscrepanciesStatsDto,
  OperatorProductivityDto,
  ZoneOccupancyDto
} from "@/lib/api/reports"
import { getGlobalLedgers } from "@/lib/api/wms-inventory"
import { getOrders, getWaves } from "@/lib/api/wms-outbound"
import { WaveDto } from "@/types/wms-outbound"

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const { activeWarehouseId } = useWarehouseContext()
  const [activeWarehouseCode, setActiveWarehouseCode] = useState("---")
  
  const [workloads, setWorkloads] = useState<PendingWorkloadsDto | null>(null)
  const [discrepancies, setDiscrepancies] = useState<DiscrepanciesStatsDto | null>(null)
  const [capacity, setCapacity] = useState<WarehouseCapacityDto | null>(null)
  const [inventoryStats, setInventoryStats] = useState<InventoryStatsDto | null>(null)
  const [operatorProductivity, setOperatorProductivity] = useState<OperatorProductivityDto[]>([])
  const [zoneOccupancy, setZoneOccupancy] = useState<ZoneOccupancyDto[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [waves, setWaves] = useState<WaveDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadDashboardData = async () => {
    if (!activeWarehouseId) return
    try {
      const [wl, disc, cap, inv, prod, zones, ords, acts, wvs] = await Promise.all([
        getWorkloads(activeWarehouseId),
        getDiscrepancies(activeWarehouseId),
        getCapacity(activeWarehouseId),
        getInventoryStats(activeWarehouseId),
        getOperatorProductivity(activeWarehouseId),
        getZoneOccupancy(activeWarehouseId),
        getOrders(activeWarehouseId),
        getGlobalLedgers(activeWarehouseId),
        getWaves(activeWarehouseId)
      ])
      setWorkloads(wl)
      setDiscrepancies(disc)
      setCapacity(cap)
      setInventoryStats(inv)
      setOperatorProductivity(prod)
      setZoneOccupancy(zones)
      setOrders(ords)
      setActivities(acts)
      setWaves(wvs)
    } catch (err) {
      console.error("Error loading WMS Dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeWarehouseId) {
      getWarehouses(true).then(warehouses => {
        const wh = warehouses.find(w => w.id === activeWarehouseId)
        if (wh) {
          setActiveWarehouseCode(wh.code)
        }
      }).catch(console.error)

      loadDashboardData()
      const interval = setInterval(loadDashboardData, 10000)
      return () => clearInterval(interval)
    }
  }, [activeWarehouseId])

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
    <div className="flex flex-col h-full bg-[#f8fafc]">
      {/* Sub-header */}
      <div className="bg-muted border-b border-border px-4 py-1 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-foreground">Operations Dashboard</h1>
          <span className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded font-medium">Warehouse: {activeWarehouseCode}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{currentDate}</span>
          <span className="font-mono bg-foreground text-background px-2 py-0.5 rounded font-bold shadow-sm">{currentTime}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-2 space-y-2 overflow-auto max-w-[1600px] mx-auto w-full">
        {/* Status Tiles Row */}
        <StatusTiles workloads={workloads} discrepancies={discrepancies} />
        
        {/* Stats Row */}
        <StatCards 
          inventoryStats={inventoryStats} 
          capacity={capacity} 
          operatorProductivity={operatorProductivity} 
          workloads={workloads} 
        />
        
        {/* Middle Section - Zone + Worker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2">
            <ZoneOverview zones={zoneOccupancy} />
          </div>
          <div className="lg:col-span-1">
            <WorkerStatus workers={operatorProductivity} />
          </div>
        </div>
        
        {/* Wave Progress & Active Pick Waves */}
        {waves && waves.length > 0 && waves.some(w => w.status !== 'Completed') && (
          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2.5">Đợt gom hàng đang thực hiện (Pick Waves Progress)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {waves.filter(w => w.status !== 'Completed').map(w => {
                let progressPercent = 0;
                let progressColor = "bg-blue-500";
                if (w.status === 'Picking') {
                  progressPercent = 40;
                  progressColor = "bg-amber-500 animate-pulse";
                } else if (w.status === 'Picked') {
                  progressPercent = 85;
                  progressColor = "bg-blue-600";
                } else if (w.status === 'New') {
                  progressPercent = 10;
                  progressColor = "bg-slate-400";
                }
                return (
                  <div key={w.id} className="border border-slate-100 p-2.5 rounded-lg bg-slate-50/50 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">Wave #{w.waveNo}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        w.status === 'Picking' ? 'bg-amber-50 text-amber-600' :
                        w.status === 'Picked' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>{w.status}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Loại: {w.type}</span>
                      <span>Đơn hàng: {w.orderCount}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <OrderQueue orders={orders} />
          <ActivityLog activities={activities} />
        </div>
      </div>
    </div>
  )
}
