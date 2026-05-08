"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OrderEntry {
  orderId: string
  customer: string
  items: number
  zone: string
  priority: "urgent" | "high" | "normal"
  age: string
  status: "waiting" | "picking" | "packing" | "qc"
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

export function OrderQueue() {
  const orders: OrderEntry[] = [
    { orderId: "ORD-7845", customer: "Acme Corp", items: 12, zone: "A-3", priority: "urgent", age: "2h 15m", status: "waiting" },
    { orderId: "ORD-7844", customer: "TechStart Inc", items: 5, zone: "B-1", priority: "urgent", age: "1h 45m", status: "picking" },
    { orderId: "ORD-7843", customer: "Global Trade", items: 23, zone: "C-2", priority: "high", age: "1h 30m", status: "waiting" },
    { orderId: "ORD-7842", customer: "Local Shop", items: 3, zone: "A-1", priority: "normal", age: "1h 20m", status: "packing" },
    { orderId: "ORD-7841", customer: "MegaMart", items: 45, zone: "D-4", priority: "high", age: "1h 10m", status: "qc" },
    { orderId: "ORD-7840", customer: "Quick Delivery", items: 8, zone: "B-3", priority: "normal", age: "55m", status: "picking" },
    { orderId: "ORD-7839", customer: "E-Store Pro", items: 15, zone: "A-2", priority: "urgent", age: "45m", status: "waiting" },
    { orderId: "ORD-7838", customer: "Retail Hub", items: 7, zone: "C-1", priority: "normal", age: "40m", status: "waiting" },
    { orderId: "ORD-7837", customer: "Supply Chain Co", items: 31, zone: "D-2", priority: "high", age: "35m", status: "waiting" },
    { orderId: "ORD-7836", customer: "Direct Sales", items: 2, zone: "A-4", priority: "normal", age: "30m", status: "picking" },
    { orderId: "ORD-7835", customer: "Wholesale Dist", items: 18, zone: "B-2", priority: "normal", age: "25m", status: "waiting" },
    { orderId: "ORD-7834", customer: "Online Outlet", items: 9, zone: "C-3", priority: "normal", age: "20m", status: "waiting" },
  ]

  return (
    <div className="border border-border bg-white">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Order Queue</h3>
        <span className="text-[10px] text-muted-foreground">{orders.length} orders</span>
      </div>
      <div className="overflow-auto max-h-[320px]">
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
      </div>
    </div>
  )
}
