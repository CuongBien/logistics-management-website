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
  const activities: ActivityEntry[] = []

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
