"use client"

interface Zone {
  id: string
  name: string
  ordersActive: number
  workersAssigned: number
  capacity: number
  alerts: number
}

export function ZoneOverview() {
  const zones: Zone[] = [
    { id: "A", name: "Zone A - Electronics", ordersActive: 12, workersAssigned: 4, capacity: 85, alerts: 0 },
    { id: "B", name: "Zone B - Apparel", ordersActive: 8, workersAssigned: 3, capacity: 60, alerts: 1 },
    { id: "C", name: "Zone C - General", ordersActive: 15, workersAssigned: 5, capacity: 92, alerts: 2 },
    { id: "D", name: "Zone D - Bulk", ordersActive: 6, workersAssigned: 2, capacity: 45, alerts: 0 },
  ]

  return (
    <div className="border border-border bg-white">
      <div className="bg-muted px-3 py-1.5 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Zone Overview</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        {zones.map((zone, index) => (
          <div
            key={zone.id}
            className={`p-2 ${index < zones.length - 1 ? "border-r border-border/50" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Zone {zone.id}</span>
              {zone.alerts > 0 && (
                <span className="bg-red-600 text-white text-[9px] px-1 font-bold">{zone.alerts}</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground mb-1 truncate">{zone.name.split(" - ")[1]}</div>
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Orders:</span>
                <span className="font-medium">{zone.ordersActive}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">Workers:</span>
                <span className="font-medium">{zone.workersAssigned}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex-1 h-1.5 bg-muted overflow-hidden">
                  <div
                    className={`h-full ${zone.capacity >= 90 ? "bg-red-500" : zone.capacity >= 70 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${zone.capacity}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-mono">{zone.capacity}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
