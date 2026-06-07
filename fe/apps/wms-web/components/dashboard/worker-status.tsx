"use client"

import { useState, useEffect, useCallback } from "react"
import { getOperatorProductivity, OperatorProductivityDto } from "@/lib/api/reports"
import { getPutawayTasks } from "@/lib/api/wms-tasks"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"

interface Worker {
  id: string
  name: string
  task: string
  orderId: string
  efficiency: number
  status: "active" | "idle" | "break"
}

const statusClasses = {
  active: "bg-emerald-500 shadow-emerald-500/30",
  idle: "bg-amber-500 shadow-amber-500/30",
  break: "bg-slate-400 shadow-slate-400/30",
}

function formatOperatorName(operatorId: string): string {
  if (!operatorId) return "System"
  
  // If it's a raw UUID, return a clean Operator code
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operatorId)) {
    return `Operator ${operatorId.substring(0, 8).toUpperCase()}`
  }

  // e.g. 'staff_han_0' -> 'Staff HAN #0'
  const parts = operatorId.replace(/-/g, "_").split("_")
  if (parts.length === 0) return operatorId

  const formatted = parts.map((part, idx) => {
    if (idx === parts.length - 1 && /^\d+$/.test(part)) {
      return `#${part}`
    }
    if (part.length <= 3 && part.length > 0) {
      return part.toUpperCase()
    }
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  })

  return formatted.join(" ")
}

const TASK_LABELS = ["Putaway", "Pick", "Replenish", "Count"]

function mapToWorker(dto: OperatorProductivityDto, index: number): Worker {
  const { operatorId, pendingTasks, completedTasksToday } = dto

  const efficiency =
    completedTasksToday > 0
      ? Math.min(
          Math.round(
            (completedTasksToday / (completedTasksToday + pendingTasks)) * 100
          ),
          120
        )
      : 0

  const status: Worker["status"] =
    pendingTasks > 0 ? "active" : completedTasksToday > 0 ? "idle" : "break"

  const task =
    pendingTasks > 0 ? TASK_LABELS[index % TASK_LABELS.length] : "Standby"

  return {
    id: operatorId.substring(0, 8),
    name: formatOperatorName(operatorId),
    task,
    orderId: pendingTasks > 0 ? `${pendingTasks} pending` : "-",
    efficiency,
    status,
  }
}

function WorkerSkeleton() {
  return (
    <div className="p-3 border border-border/60 rounded-lg flex items-center justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="h-2 w-2 bg-muted rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-2.5 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="h-1.5 w-16 bg-muted rounded" />
    </div>
  )
}

export function WorkerStatus() {
  const { activeWarehouseId } = useWarehouseContext()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [operators] = await Promise.all([
        getOperatorProductivity(activeWarehouseId ?? undefined),
        getPutawayTasks(activeWarehouseId ?? undefined),
      ])

      const mapped = (operators ?? []).map(mapToWorker)
      setWorkers(mapped)
    } catch (err) {
      console.error("Failed to fetch worker status:", err)
    } finally {
      setLoading(false)
    }
  }, [activeWarehouseId])

  useEffect(() => {
    setLoading(true)
    fetchData()

    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const activeCount = workers.filter((w) => w.status === "active").length
  const idleCount = workers.filter((w) => w.status === "idle").length
  const breakCount = workers.filter((w) => w.status === "break").length

  return (
    <div className="border border-border bg-white rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      <div className="bg-muted px-4 py-2.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">Worker Status</h3>
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
            <span className="text-muted-foreground font-medium">{activeCount} Active</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20" />
            <span className="text-muted-foreground font-medium">{idleCount} Idle</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="h-2 w-2 rounded-full bg-slate-400 shadow-sm shadow-slate-400/20" />
            <span className="text-muted-foreground font-medium">{breakCount} Break</span>
          </span>
        </div>
      </div>
      <div className="overflow-auto p-3 flex-1 max-h-[300px]">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <WorkerSkeleton key={i} />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
            No operator data available
          </div>
        ) : (
          <div className="space-y-2">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-3 border border-border/70 rounded-lg flex items-center justify-between gap-4 transition-all duration-200 hover:border-border hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shadow-sm shrink-0 ${statusClasses[worker.status]} ${
                      worker.status === "active" ? "animate-pulse" : ""
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">{worker.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-muted px-1 py-0.5 rounded text-[9px]">ID: {worker.id}</span>
                      <span className="text-slate-300">•</span>
                      <span>{worker.task}</span>
                      {worker.orderId !== "-" && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-blue-600 font-medium">{worker.orderId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-1.5 bg-muted overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        worker.efficiency >= 100
                          ? "bg-emerald-500"
                          : worker.efficiency >= 90
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(worker.efficiency, 120)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono min-w-[24px] text-right">{worker.efficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
