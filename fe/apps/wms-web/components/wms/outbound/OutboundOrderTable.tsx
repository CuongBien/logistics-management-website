"use client"

import { OutboundOrderDto, OutboundOrderStatus } from "@/types/wms-outbound"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Badge } from "@repo/ui/components/badge"
import { Button } from "@repo/ui/components/button"
import { Eye, FileText, ArrowUpRight, Ban, CheckCircle2, Clock } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface OutboundOrderTableProps {
  orders: OutboundOrderDto[]
}

export function OutboundOrderTable({ orders }: OutboundOrderTableProps) {
  
  // Format Outbound Status Badges Helper
  const formatStatus = (status: OutboundOrderStatus) => {
    switch (status) {
      case 'New':
        return <Badge variant="outline" className="bg-zinc-100 text-zinc-700 border-zinc-200 font-bold px-2 py-0.5 select-none">Mới tạo (New)</Badge>;
      case 'Allocating':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold px-2 py-0.5 select-none animate-pulse">Cấp phát...</Badge>;
      case 'Allocated':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-2 py-0.5 select-none">Đã cấp phát (Allocated)</Badge>;
      case 'AwaitingPick':
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold px-2 py-0.5 select-none">Chờ lấy hàng</Badge>;
      case 'Picking':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5 select-none animate-pulse">Đang lấy hàng</Badge>;
      case 'Picked':
        return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold px-2 py-0.5 select-none">Đã lấy hàng</Badge>;
      case 'Packing':
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold px-2 py-0.5 select-none">Đang đóng gói</Badge>;
      case 'Packed':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold px-2 py-0.5 select-none">Đã đóng gói (Packed)</Badge>;
      case 'Shipped':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5 select-none">Đã xuất kho (Shipped)</Badge>;
      case 'Cancelled':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold px-2 py-0.5 select-none">Đã hủy (Cancelled)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  // Format Tenant Badge Helper
  const formatTenant = (tenant: string) => {
    switch (tenant) {
      case 'tenant-shopee': return <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">Shopee</Badge>;
      case 'tenant-lazada': return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">Lazada</Badge>;
      case 'tenant-tiktok': return <Badge variant="outline" className="bg-zinc-850 bg-slate-900 text-white font-bold dark:bg-zinc-700">TikTok</Badge>;
      default: return <Badge variant="outline">{tenant}</Badge>;
    }
  }

  return (
    <div className="border border-muted rounded-xl overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold">Mã Đơn Xuất (OrderNo)</TableHead>
            <TableHead className="font-bold">Chủ Hàng (Tenant)</TableHead>
            <TableHead className="font-bold text-center">Trạng Thái Đơn</TableHead>
            <TableHead className="font-bold text-right">Tổng SKU Mặt Hàng</TableHead>
            <TableHead className="font-bold text-right">Tổng Sản Phẩm</TableHead>
            <TableHead className="font-bold">Ngày Tạo Đơn</TableHead>
            <TableHead className="font-bold text-center w-[100px]">Thao Tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const totalSkus = o.lines.length
            const totalQty = o.lines.reduce((sum, l) => sum + l.quantity, 0)

            return (
              <TableRow key={o.id} className="hover:bg-muted/15 transition-colors">
                {/* Order No */}
                <TableCell className="align-middle font-bold font-mono text-sm py-4">
                  {o.orderNo}
                </TableCell>

                {/* Tenant */}
                <TableCell className="align-middle py-4">
                  {formatTenant(o.tenantId)}
                </TableCell>

                {/* Status */}
                <TableCell className="align-middle py-4 text-center">
                  {formatStatus(o.status)}
                </TableCell>

                {/* Total SKU */}
                <TableCell className="align-middle text-right font-bold py-4">
                  {totalSkus}
                </TableCell>

                {/* Total Qty */}
                <TableCell className="align-middle text-right font-mono font-extrabold text-primary py-4">
                  {totalQty.toLocaleString()}
                </TableCell>

                {/* Created Date */}
                <TableCell className="align-middle font-mono text-xs text-muted-foreground py-4">
                  {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm")}
                </TableCell>

                {/* Actions */}
                <TableCell className="align-middle text-center py-4">
                  <Link href={`/wms/outbound/orders/${o.id}`} passHref>
                    <Button variant="outline" size="sm" className="h-8 gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                      <Eye className="h-3.5 w-3.5" />
                      Chi tiết
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}

          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-36 text-center py-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Chưa có đơn xuất kho nào được tiếp nhận.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
