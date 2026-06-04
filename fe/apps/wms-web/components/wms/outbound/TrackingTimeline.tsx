"use client"

import { OutboundOrderTimelineDto, OutboundOrderStatus } from "@/types/wms-outbound"
import { format } from "date-fns"
import { Badge } from "@repo/ui/components/badge"
import { CheckCircle2, Circle, AlertCircle, Play, Package, ShieldCheck, Box, Send, Wrench, Ban } from "lucide-react"

interface TrackingTimelineProps {
  timeline: OutboundOrderTimelineDto[]
}

export function TrackingTimeline({ timeline }: TrackingTimelineProps) {
  
  // Sort timeline descending (newest first)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  // Status Icon Mapping
  const getStatusIcon = (status: OutboundOrderStatus, isLatest: boolean) => {
    const size = isLatest ? "h-5 w-5 animate-pulse" : "h-4 w-4"
    switch (status) {
      case 'New':
        return <Play className={`${size} text-zinc-500`} />;
      case 'Allocating':
        return <Wrench className={`${size} text-blue-500 animate-spin`} />;
      case 'Allocated':
        return <ShieldCheck className={`${size} text-indigo-600`} />;
      case 'AwaitingPick':
        return <ClockIcon className={`${size} text-sky-500`} />;
      case 'Picking':
        return <Box className={`${size} text-amber-500`} />;
      case 'Picked':
        return <Package className={`${size} text-orange-500`} />;
      case 'Packing':
        return <Box className={`${size} text-violet-500`} />;
      case 'Packed':
        return <Package className={`${size} text-purple-600`} />;
      case 'Shipped':
        return <Send className={`${size} text-emerald-500`} />;
      case 'Cancelled':
        return <Ban className={`${size} text-rose-500`} />;
      default:
        return <Circle className={size} />;
    }
  }

  // Status Header Formatter Helper
  const getStatusLabel = (status: OutboundOrderStatus) => {
    switch (status) {
      case 'New': return 'Đơn hàng mới tạo';
      case 'Allocating': return 'Đang cấp phát hàng';
      case 'Allocated': return 'Đã cấp phát tồn kho';
      case 'AwaitingPick': return 'Chờ đợt lấy hàng';
      case 'Picking': return 'Đang lấy hàng (Picking)';
      case 'Picked': return 'Lấy hàng hoàn tất';
      case 'Packing': return 'Đang thực hiện đóng gói';
      case 'Packed': return 'Đã đóng gói (Packed)';
      case 'Shipped': return 'Đã xuất kho (Shipped)';
      case 'Cancelled': return 'Đơn hàng đã hủy';
      default: return status;
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative pl-6 border-l border-muted space-y-8 py-2 ml-3.5">
        {sortedTimeline.map((event, index) => {
          const isLatest = index === 0
          
          return (
            <div key={event.id} className="relative group">
              {/* Vertical connector line dots */}
              <div className={`absolute -left-[35px] top-1 flex items-center justify-center rounded-full bg-background border transition-all duration-300 ${
                isLatest 
                  ? "h-7 w-7 border-primary shadow-sm bg-primary/10 ring-4 ring-primary/15" 
                  : "h-5 w-5 border-muted bg-card hover:border-primary/50"
              }`}>
                {getStatusIcon(event.status, isLatest)}
              </div>

              {/* Event Card Content */}
              <div className={`border rounded-xl p-4 transition-all duration-300 ${
                isLatest 
                  ? "bg-card border-primary/25 shadow-md" 
                  : "bg-muted/10 border-muted hover:border-primary/20"
              }`}>
                {/* Event meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isLatest ? "text-primary" : "text-foreground/90"}`}>
                      {getStatusLabel(event.status)}
                    </span>
                    {isLatest && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-extrabold animate-pulse">
                        Mới nhất
                      </Badge>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {format(new Date(event.occurredAt), "dd/MM/yyyy HH:mm:ss")}
                  </span>
                </div>

                {/* Event Notes Description */}
                {event.notes && (
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    {event.notes}
                  </p>
                )}

                {/* Operator ID */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/75 font-mono">
                  <span>Người thực hiện:</span>
                  <span className="font-semibold text-foreground/80">{event.operatorId}</span>
                </div>
              </div>
            </div>
          )
        })}

        {sortedTimeline.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground italic">
            Chưa ghi nhận lịch sử biến động trạng thái cho đơn hàng này.
          </div>
        )}
      </div>
    </div>
  )
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
