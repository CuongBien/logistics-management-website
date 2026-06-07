"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table"

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

interface ActivityLogProps {
  activities?: any[];
}

export function ActivityLog({ activities = [] }: ActivityLogProps) {
  const mappedActivities = activities.slice(0, 15).map(l => {
    let eventName = "Biến động kho";
    let status: "success" | "warning" | "error" | "info" = "info";

    const reasonVal = l.reason;

    if (reasonVal === 1 || reasonVal === "InboundReceived" || reasonVal === 11 || reasonVal === "TransitReceived") {
      eventName = `Nhập kho SKU: ${l.sku} (+${l.deltaQty})`;
      status = "success";
    } else if (reasonVal === 8 || reasonVal === "AdjustIncrease" || reasonVal === 9 || reasonVal === "AdjustDecrease") {
      eventName = `Kiểm kê SKU: ${l.sku} (${l.deltaQty > 0 ? "+" : ""}${l.deltaQty})`;
      status = "warning";
    } else if (reasonVal === 4 || reasonVal === "Pick") {
      eventName = `Lấy hàng SKU: ${l.sku} (-${Math.abs(l.deltaQty)})`;
      status = "info";
    } else if (reasonVal === 12 || reasonVal === "InternalTransfer") {
      eventName = `Dịch chuyển SKU: ${l.sku} (${l.deltaQty > 0 ? "+" : ""}${l.deltaQty})`;
      status = "info";
    } else {
      eventName = `Thay đổi SKU: ${l.sku} (${l.deltaQty > 0 ? "+" : ""}${l.deltaQty})`;
    }

    return {
      time: new Date(l.occurredAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
      orderId: l.referenceId || "N/A",
      event: eventName,
      operator: l.operatorSub || "system",
      status: status
    }
  });

  return (
    <div className="border border-border bg-white h-full">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Nhật ký hoạt động trực tiếp (WMS Ledger)</h3>
        <span className="text-[10px] text-muted-foreground">Auto-refresh: 10s</span>
      </div>
      <div className="overflow-auto max-h-[320px]">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50">
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[80px]">Giờ</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[110px]">Mã tham chiếu</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2">Hoạt động</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase h-7 py-1 px-2 w-[90px]">Nhân viên</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                  Không có nhật ký hoạt động nào ghi nhận
                </TableCell>
              </TableRow>
            ) : (
              mappedActivities.map((activity, index) => (
                <TableRow key={index} className="border-b border-border/50 hover:bg-muted/30">
                  <TableCell className="text-xs font-mono py-1 px-2">{activity.time}</TableCell>
                  <TableCell className="text-xs font-mono py-1 px-2 text-blue-600 truncate max-w-[110px]" title={activity.orderId}>{activity.orderId}</TableCell>
                  <TableCell className="py-1 px-2">
                    <span className={`text-[10px] px-1.5 py-0.5 font-semibold rounded-sm ${statusClasses[activity.status]}`}>
                      {activity.event}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs py-1 px-2 text-muted-foreground font-mono truncate max-w-[90px]" title={activity.operator}>{activity.operator}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
