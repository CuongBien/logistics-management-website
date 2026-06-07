"use client"

import { useState, useEffect, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { getGlobalLedgers } from "@/lib/api/wms-inventory"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import { Loader2 } from "lucide-react"

interface ActivityEntry {
  id: string
  time: string
  orderId: string
  event: string
  operator: string
  status: "success" | "warning" | "error" | "info"
}

const statusClasses = {
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return "--:--:--"
  }
}

function mapReasonToEvent(reason: string | undefined): string {
  if (!reason) return "Stock Movement"
  const r = reason.trim()
  if (/^(Inbound|Receipt)$/i.test(r)) return "Goods Received"
  if (/^Putaway$/i.test(r)) return "Putaway Complete"
  if (/^Pick$/i.test(r)) return "Order Picked"
  if (/^Transfer$/i.test(r)) return "Stock Transferred"
  if (/^(Reconcile|Adjust)$/i.test(r)) return "Stock Adjusted"
  return r || "Stock Movement"
}

function mapStatus(
  deltaQty: number,
  reason: string | undefined
): ActivityEntry["status"] {
  const r = (reason || "").toLowerCase()
  if (r.includes("error") || r.includes("discrep")) return "error"
  if (deltaQty > 0) return "success"
  if (deltaQty < 0) return "warning"
  return "info"
}

function mapLedgerToActivity(ledger: any): ActivityEntry {
  return {
    id: ledger.id || crypto.randomUUID(),
    time: formatTime(ledger.occurredAt),
    orderId: ledger.referenceId
      ? ledger.referenceId.substring(0, 8)
      : ledger.sku || "—",
    event: mapReasonToEvent(ledger.reason),
    operator: ledger.operatorSub
      ? ledger.operatorSub.length > 12
        ? ledger.operatorSub.substring(0, 12) + "…"
        : ledger.operatorSub
      : "system",
    status: mapStatus(ledger.deltaQty ?? 0, ledger.reason),
  }
}

const REFRESH_INTERVAL = 15_000
const MAX_ENTRIES = 20

export function ActivityLog() {
  const { activeWarehouseId } = useWarehouseContext()
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const prevIdsRef = useRef<Set<string>>(new Set())

  const fetchActivities = async (isInitial = false) => {
    try {
      const ledgers = await getGlobalLedgers(
        activeWarehouseId || undefined
      )

      const sorted = [...ledgers].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )

      const mapped = sorted.slice(0, MAX_ENTRIES).map(mapLedgerToActivity)

      // Detect new entries for fade-in animation
      if (!isInitial) {
        const incoming = new Set(mapped.map((a) => a.id))
        const fresh = new Set<string>()
        incoming.forEach((id) => {
          if (!prevIdsRef.current.has(id)) fresh.add(id)
        })
        if (fresh.size > 0) {
          setNewIds(fresh)
          setTimeout(() => setNewIds(new Set()), 600)
        }
      }

      prevIdsRef.current = new Set(mapped.map((a) => a.id))
      setActivities(mapped)
    } catch (err) {
      console.error("Failed to fetch activity log:", err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    prevIdsRef.current = new Set()
    fetchActivities(true)
  }, [activeWarehouseId])

  useEffect(() => {
    const interval = setInterval(() => fetchActivities(false), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [activeWarehouseId])

  return (
    <div className="border border-border bg-white">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Live Activity Log
        </h3>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            Auto-refresh: 15s
          </span>
        </div>
      </div>
      <div className="overflow-auto max-h-[320px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading activity…</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <span className="text-xs">No recent activity</span>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[80px]">
                  Time
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[90px]">
                  Reference
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2">
                  Event
                </TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[100px]">
                  Operator
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow
                  key={activity.id}
                  className={`border-b border-border/50 hover:bg-muted/30 transition-all duration-500 ${
                    newIds.has(activity.id)
                      ? "animate-in fade-in-0 slide-in-from-top-1 bg-accent/30"
                      : ""
                  }`}
                >
                  <TableCell className="text-xs font-mono py-1 px-2">
                    {activity.time}
                  </TableCell>
                  <TableCell className="text-xs font-mono py-1 px-2 text-blue-600">
                    {activity.orderId}
                  </TableCell>
                  <TableCell className="py-1 px-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 font-medium ${statusClasses[activity.status]}`}
                    >
                      {activity.event}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs py-1 px-2 text-muted-foreground">
                    {activity.operator}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
