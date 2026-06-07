"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"

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

import { OutboundOrderDto } from "@/types/wms-outbound"

interface OrderQueueProps {
  orders?: OutboundOrderDto[];
}

export function OrderQueue({ orders = [] }: OrderQueueProps) {
  const mappedOrders = orders.slice(0, 10).map(o => {
    const itemsCount = o.lines.reduce((sum, l) => sum + l.quantity, 0);

    let priority: "urgent" | "high" | "normal" = "normal";
    if (itemsCount > 10) priority = "urgent";
    else if (itemsCount > 3) priority = "high";

    let status: "waiting" | "picking" | "packing" | "qc" = "waiting";
    if (o.status === "Picking") status = "picking";
    else if (o.status === "Packing") status = "packing";
    else if (o.status === "Packed") status = "qc";

    return {
      orderId: o.orderNo,
      customer: o.tenantId,
      items: itemsCount,
      zone: o.lines[0]?.sku.slice(0, 6) || "WH",
      priority: priority,
      age: new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      status: status
    }
  });

  return (
    <div className="border border-border bg-white h-full">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Hàng đợi đơn hàng xuất kho</h3>
        <span className="text-[10px] text-muted-foreground">{orders.length} đơn</span>
      </div>
      <div className="overflow-auto max-h-[320px]">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[100px]">Mã đơn</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2">Khách hàng</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[60px] text-center">Items</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[70px]">Mã SKU</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[70px]">Ưu tiên</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[60px]">Giờ tạo</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[80px]">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                  Không có đơn hàng xuất nào
                </TableCell>
              </TableRow>
            ) : (
              mappedOrders.map((order) => (
                <TableRow key={order.orderId} className="border-b border-border/50 hover:bg-muted/30">
                  <TableCell className="text-xs font-mono py-1 px-2 text-blue-600 font-bold">{order.orderId}</TableCell>
                  <TableCell className="text-xs py-1 px-2 truncate max-w-[120px]">{order.customer}</TableCell>
                  <TableCell className="text-xs py-1 px-2 text-center font-bold font-mono">{order.items}</TableCell>
                  <TableCell className="text-xs font-mono py-1 px-2 truncate max-w-[60px]" title={order.zone}>{order.zone}</TableCell>
                  <TableCell className="py-1 px-2">
                    <span className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded-sm ${priorityClasses[order.priority]}`}>
                      {order.priority === "urgent" ? "Khẩn" : order.priority === "high" ? "Cao" : "Thường"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs py-1 px-2 font-mono text-muted-foreground">{order.age}</TableCell>
                  <TableCell className="py-1 px-2">
                    <span className={`text-[9px] px-1.5 py-0.5 font-semibold capitalize rounded-sm ${statusClasses[order.status]}`}>
                      {order.status === "waiting" ? "Chờ xử lý" : order.status === "picking" ? "Đang lấy" : order.status === "packing" ? "Đóng gói" : "QC"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
