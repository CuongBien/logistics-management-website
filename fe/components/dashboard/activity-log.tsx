"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ActivityEntry {
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

export function ActivityLog() {
  const activities: ActivityEntry[] = [
    { time: "14:32:15", orderId: "ORD-7842", event: "Order picked", operator: "J. Martinez", status: "success" },
    { time: "14:31:58", orderId: "ORD-7841", event: "QC passed", operator: "S. Kim", status: "success" },
    { time: "14:31:45", orderId: "ORD-7839", event: "Stock issue flagged", operator: "System", status: "error" },
    { time: "14:31:22", orderId: "ORD-7840", event: "Packing started", operator: "M. Johnson", status: "info" },
    { time: "14:30:55", orderId: "ORD-7838", event: "Shipped", operator: "R. Davis", status: "success" },
    { time: "14:30:41", orderId: "ORD-7837", event: "Label printed", operator: "A. Wilson", status: "info" },
    { time: "14:30:18", orderId: "ORD-7836", event: "Weight mismatch", operator: "System", status: "warning" },
    { time: "14:29:55", orderId: "ORD-7835", event: "Order picked", operator: "T. Brown", status: "success" },
    { time: "14:29:32", orderId: "ORD-7834", event: "Priority upgraded", operator: "Admin", status: "warning" },
    { time: "14:29:10", orderId: "ORD-7833", event: "QC passed", operator: "S. Kim", status: "success" },
    { time: "14:28:45", orderId: "ORD-7832", event: "Shipped", operator: "R. Davis", status: "success" },
    { time: "14:28:22", orderId: "ORD-7831", event: "Packing completed", operator: "M. Johnson", status: "success" },
    { time: "14:27:58", orderId: "ORD-7830", event: "Picking started", operator: "J. Martinez", status: "info" },
    { time: "14:27:35", orderId: "ORD-7829", event: "Address corrected", operator: "Admin", status: "warning" },
    { time: "14:27:12", orderId: "ORD-7828", event: "Order received", operator: "System", status: "info" },
    { time: "14:26:48", orderId: "ORD-7827", event: "Shipped", operator: "R. Davis", status: "success" },
    { time: "14:26:25", orderId: "ORD-7826", event: "QC failed", operator: "S. Kim", status: "error" },
    { time: "14:26:02", orderId: "ORD-7825", event: "Backorder created", operator: "System", status: "warning" },
    { time: "14:25:38", orderId: "ORD-7824", event: "Order picked", operator: "T. Brown", status: "success" },
    { time: "14:25:15", orderId: "ORD-7823", event: "Shipped", operator: "R. Davis", status: "success" },
  ]

  return (
    <div className="border border-border bg-white">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Live Activity Log</h3>
        <span className="text-[10px] text-muted-foreground">Auto-refresh: 5s</span>
      </div>
      <div className="overflow-auto max-h-[320px]">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[80px]">Time</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[90px]">Order ID</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2">Event</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[100px]">Operator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity, index) => (
              <TableRow key={index} className="border-b border-border/50 hover:bg-muted/30">
                <TableCell className="text-xs font-mono py-1 px-2">{activity.time}</TableCell>
                <TableCell className="text-xs font-mono py-1 px-2 text-blue-600">{activity.orderId}</TableCell>
                <TableCell className="py-1 px-2">
                  <span className={`text-[10px] px-1.5 py-0.5 font-medium ${statusClasses[activity.status]}`}>
                    {activity.event}
                  </span>
                </TableCell>
                <TableCell className="text-xs py-1 px-2 text-muted-foreground">{activity.operator}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
