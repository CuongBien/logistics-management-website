"use client"

import { useState, useEffect } from "react"
import { getWarehouseHierarchy } from "@/lib/api/wms-layout"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

interface ZoneInfo {
  id: string
  name: string
  totalBins: number
  occupiedBins: number
  capacity: number
  type: string
}

export function ZoneOverview() {
  const { activeWarehouseId } = useWarehouseContext()
  const [zones, setZones] = useState<ZoneInfo[]>([])

  useEffect(() => {
    if (activeWarehouseId) {
      getWarehouseHierarchy(activeWarehouseId)
        .then((hierarchy) => {
          const list: ZoneInfo[] = []
          if (hierarchy && hierarchy.blocks) {
            for (const blk of hierarchy.blocks) {
              const blockCode = (blk as any).blockCode || blk.code || "Block"
              if (blk.zones) {
                for (const zone of blk.zones) {
                  const type = (zone as any).zoneType || zone.type || "Storage"
                  const bins = zone.bins || []
                  const total = bins.length
                  const occupied = bins.filter(b => b.status === "Occupied" || b.status === "Full").length
                  const rate = total === 0 ? 0 : Math.round((occupied / total) * 100)
                  list.push({
                    id: zone.id.substring(0, 8),
                    name: `${blockCode} — ${type}`,
                    totalBins: total,
                    occupiedBins: occupied,
                    capacity: rate,
                    type: type
                  })
                }
              }
            }
          }
          setZones(list)
        })
        .catch(console.error)
    }
  }, [activeWarehouseId])

  return (
    <div className="border border-border bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-muted px-4 py-2.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Zone & Layout Capacity</h3>
        <span className="text-[10px] text-muted-foreground font-mono">{zones.length} Zones configured</span>
      </div>
      
      {zones.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground my-auto">
          No zone layout found for this warehouse.
        </div>
      ) : (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 overflow-auto">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="p-3 border border-border/80 rounded-lg hover:bg-muted/30 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className="text-xs font-bold text-foreground truncate">{zone.name}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    zone.type === "Inbound" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                    zone.type === "Outbound" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                    zone.type === "CrossDock" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                    "bg-slate-50 text-slate-600 border border-slate-200"
                  }`}>
                    {zone.type}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground mb-3">ID: {zone.id}</div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Total Bins:</span>
                  <span className="font-semibold text-foreground">{zone.totalBins}</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Occupied Bins:</span>
                  <span className="font-semibold text-foreground">{zone.occupiedBins}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-1 border-t border-border/40">
                  <div className="flex-1 h-2 bg-muted overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        zone.capacity >= 90 ? "bg-rose-500" : 
                        zone.capacity >= 70 ? "bg-amber-500" : 
                        "bg-emerald-500"
                      }`}
                      style={{ width: `${zone.capacity}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono min-w-[28px] text-right">{zone.capacity}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
