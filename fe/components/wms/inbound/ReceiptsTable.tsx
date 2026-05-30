"use client"

import { InboundReceiptDto, InboundReceiptStatus } from "@/types/wms-inbound"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, ClipboardList, CheckCircle2, AlertTriangle, XCircle, Ban } from "lucide-react"
import Link from "next/link"

interface ReceiptsTableProps {
  receipts: InboundReceiptDto[]
}

export function ReceiptsTable({ receipts }: ReceiptsTableProps) {
  
  // Format Receipt Status Helper
  const formatStatus = (status: InboundReceiptStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold gap-1.5 flex items-center justify-center w-[160px] py-1 select-none">
            <ClipboardList className="h-3.5 w-3.5" />
            Đang Chờ (Pending)
          </Badge>
        );
      case 'PartiallyReceived':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold gap-1.5 flex items-center justify-center w-[160px] py-1 select-none animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            Nhận Một Phần
          </Badge>
        );
      case 'Received':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold gap-1.5 flex items-center justify-center w-[160px] py-1 select-none">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã Nhận Đủ
          </Badge>
        );
      case 'CompletedWithExceptions':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 font-bold gap-1.5 flex items-center justify-center w-[160px] py-1 select-none">
            <XCircle className="h-3.5 w-3.5" />
            Lỗi Chênh Lệch
          </Badge>
        );
      case 'Closed':
        return (
          <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-zinc-500/20 font-bold gap-1.5 flex items-center justify-center w-[160px] py-1 select-none">
            <Ban className="h-3.5 w-3.5" />
            Đã Đóng Phiếu
          </Badge>
        );
      case 'Cancelled':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold gap-1.5 flex items-center justify-center w-[160px] py-1 select-none">
            <XCircle className="h-3.5 w-3.5" />
            Đã Hủy Bỏ
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="border border-muted rounded-xl overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold">Mã Phiếu Nhập (ReceiptNo)</TableHead>
            <TableHead className="font-bold">Mã Đơn Hàng Gốc (OrderId)</TableHead>
            <TableHead className="font-bold text-center">Trạng Thái Phiếu</TableHead>
            <TableHead className="font-bold text-right">Tổng SKU Mặt Hàng</TableHead>
            <TableHead className="font-bold text-right">Tổng Lượng Dự Kiến (Expected)</TableHead>
            <TableHead className="font-bold text-right">Tổng Lượng Thực Nhận</TableHead>
            <TableHead className="font-bold text-center w-[100px]">Thao Tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((r) => {
            const totalSkus = r.lines.length
            const totalExpected = r.lines.reduce((sum, l) => sum + l.expectedQuantity, 0)
            const totalReceived = r.lines.reduce((sum, l) => sum + l.receivedQuantity, 0)

            return (
              <TableRow key={r.id} className="hover:bg-muted/15 transition-colors">
                {/* Receipt No */}
                <TableCell className="align-middle font-bold font-mono text-sm py-4">
                  {r.receiptNo}
                </TableCell>

                {/* Order ID */}
                <TableCell className="align-middle font-mono text-xs text-muted-foreground py-4">
                  {r.orderId}
                </TableCell>

                {/* Status */}
                <TableCell className="align-middle py-4 flex justify-center">
                  {formatStatus(r.status)}
                </TableCell>

                {/* Total SKU */}
                <TableCell className="align-middle text-right font-bold py-4">
                  {totalSkus}
                </TableCell>

                {/* Expected Qty */}
                <TableCell className="align-middle text-right font-mono font-bold py-4">
                  {totalExpected.toLocaleString()}
                </TableCell>

                {/* Received Qty */}
                <TableCell className="align-middle text-right font-mono font-extrabold text-primary py-4">
                  {totalReceived.toLocaleString()}
                </TableCell>

                {/* Actions */}
                <TableCell className="align-middle text-center py-4">
                  <Link href={`/wms/inbound/receipts/${r.id}`} passHref>
                    <Button variant="outline" size="sm" className="h-8 gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300">
                      <Eye className="h-3.5 w-3.5" />
                      Chi tiết
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}

          {receipts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-36 text-center py-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Chưa có phiếu nhập kho nào được ghi nhận.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
