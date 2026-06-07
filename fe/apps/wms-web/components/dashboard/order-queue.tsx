"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"
import { getOrders } from "@/lib/api/wms-outbound"
import { useWarehouseContext } from "@/components/wms/rbac/WarehouseContext"
import type { OutboundOrderDto } from "@/types/wms-outbound"
import { Loader2 } from "lucide-react"

interface OrderEntry {
  orderId: string
  customer: string
  items: number
  zone: string
  priority: "urgent" | "high" | "normal"
  age: string
  status: "waiting" | "picking" | "packing" | "qc"
  /** Raw age in milliseconds for sorting */
  _ageMs: number
  /** Numeric priority weight for sorting (lower = higher priority) */
  _priorityWeight: number
}

const priorityClasses = {
  urgent: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  normal: "bg-gray-400 text-white",
}

const statusClasses = {
  waiting: "bg-blue-100 text-blue-800",
  picking: "bg-yellow-100 text-yellow-800",
  packing: "bg-purple-100 text-purple-800",
  qc: "bg-green-100 text-green-800",
}

const REFRESH_INTERVAL_MS = 30_000

function formatAge(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function derivePriority(createdAt: string): { priority: OrderEntry["priority"]; weight: number } {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageHours = ageMs / 3_600_000
  if (ageHours > 24) return { priority: "urgent", weight: 0 }
  if (ageHours > 12) return { priority: "high", weight: 1 }
  return { priority: "normal", weight: 2 }
}

function mapOutboundStatus(status: string): OrderEntry["status"] | null {
  switch (status) {
    case "New":
    case "Allocating":
    case "Allocated":
      return "waiting"
    case "Picking":
      return "picking"
    case "Packing":
      return "packing"
    case "Picked":
    case "Packed":
      return "qc"
    default:
      return null // Shipped, Cancelled — will be filtered out
  }
}

function mapOrderToEntry(order: OutboundOrderDto): OrderEntry | null {
  const queueStatus = mapOutboundStatus(order.status)
  if (!queueStatus) return null // exclude Shipped / Cancelled

  const ageMs = Date.now() - new Date(order.createdAt).getTime()
  const { priority, weight } = derivePriority(order.createdAt)

  const zone =
    order.lines.length > 0
      ? order.lines[0].sku.split("-")[0] || "Mixed"
      : "Mixed"

  return {
    orderId: order.orderNo,
    customer: order.tenantId,
    items: order.lines.length,
    zone,
    priority,
    age: formatAge(ageMs),
    status: queueStatus,
    _ageMs: ageMs,
    _priorityWeight: weight,
  }
}

export function OrderQueue() {
  const { activeWarehouseId } = useWarehouseContext()
  const [orders, setOrders] = useState<OrderEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    try {
      const raw = await getOrders(activeWarehouseId ?? undefined)
      const mapped = raw
        .map(mapOrderToEntry)
        .filter((o): o is OrderEntry => o !== null)
        .sort((a, b) => {
          // Sort by priority weight ascending (urgent first), then by age descending (oldest first)
          if (a._priorityWeight !== b._priorityWeight) return a._priorityWeight - b._priorityWeight
          return b._ageMs - a._ageMs
        })
      setOrders(mapped)
    } catch (err) {
      console.error("[OrderQueue] Failed to fetch orders:", err)
    } finally {
      setLoading(false)
    }
  }, [activeWarehouseId])

  useEffect(() => {
    setLoading(true)
    fetchOrders()

    const interval = setInterval(fetchOrders, REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchOrders])

  return (
    <div className="border border-border bg-white">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Order Queue</h3>
        <span className="text-[10px] text-muted-foreground">{orders.length} orders</span>
      </div>
      <div className="overflow-auto max-h-[320px]">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <span className="text-xs">No active orders in queue</span>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[80px]">Order</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2">Customer</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[50px] text-center">Items</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[50px]">Zone</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[60px]">Priority</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[60px]">Age</TableHead>
                <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[70px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderId} className="border-b border-border/50 hover:bg-muted/30">
                  <TableCell className="text-xs font-mono py-1 px-2 text-blue-600">{order.orderId}</TableCell>
                  <TableCell className="text-xs py-1 px-2 truncate max-w-[120px]">{order.customer}</TableCell>
                  <TableCell className="text-xs py-1 px-2 text-center font-medium">{order.items}</TableCell>
                  <TableCell className="text-xs font-mono py-1 px-2">{order.zone}</TableCell>
                  <TableCell className="py-1 px-2">
                    <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase ${priorityClasses[order.priority]}`}>
                      {order.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs py-1 px-2 font-mono text-muted-foreground">{order.age}</TableCell>
                  <TableCell className="py-1 px-2">
                    <span className={`text-[9px] px-1.5 py-0.5 font-medium capitalize ${statusClasses[order.status]}`}>
                      {order.status}
                    </span>
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
