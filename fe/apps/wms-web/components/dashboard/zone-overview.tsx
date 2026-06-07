"use client"

interface Zone {
  id: string
  name: string
  ordersActive: number
  workersAssigned: number
  capacity: number
  alerts: number
}

import { ZoneOccupancyDto } from "@/lib/api/reports"

interface ZoneOverviewProps {
  zones?: ZoneOccupancyDto[];
}

export function ZoneOverview({ zones = [] }: ZoneOverviewProps) {
  return (
    <div className="border border-border bg-white h-full">
      <div className="bg-muted px-3 py-1.5 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Tổng quan sức chứa các khu vực (Zone)</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        {zones.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground col-span-4">Không có dữ liệu khu vực</div>
        ) : (
          zones.map((zone, index) => (
            <div
              key={zone.id}
              className={`p-2 border-b border-r border-border/50`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold truncate max-w-[120px]">{zone.name}</span>
                {zone.alerts > 0 && (
                  <span className="bg-red-600 text-white text-[9px] px-1 font-bold rounded-sm" title="Kệ đầy (Full)">
                    {zone.alerts} Full
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Tác vụ hoạt động:</span>
                  <span className="font-medium">{zone.ordersActive}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Nhân lực phân công:</span>
                  <span className="font-medium">{zone.workersAssigned}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-1.5 bg-muted overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full ${zone.capacity >= 90 ? "bg-red-500" : zone.capacity >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${zone.capacity}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-mono">{zone.capacity}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
