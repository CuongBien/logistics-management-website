"use client"

import { useState } from "react"
import { CrossDockTaskDto } from "@/types/wms-crossdock"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Input } from "@repo/ui/components/input"
import { Badge } from "@repo/ui/components/badge"
import { Card, CardContent } from "@repo/ui/components/card"
import { Search, MoveRight, HelpCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react"

interface CrossDockDataGridProps {
  tasks: CrossDockTaskDto[]
}

export function CrossDockDataGrid({ tasks }: CrossDockDataGridProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Filter tasks based on Search Query (Task ID, SKU, Inbound, Outbound, Bins)
  const filteredTasks = tasks.filter(
    (t) =>
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.inboundReceiptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.outboundOrderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.inboundStagingBinCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.outboundStagingBinCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Status Badge colors helper
  const formatStatusBadge = (status: CrossDockTaskDto['status']) => {
    switch (status) {
      case "Pending":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2.5 py-0.5 select-none">
            <Clock className="h-3 w-3 mr-1 animate-pulse" />
            Chờ xử lý (Pending)
          </Badge>
        );
      case "InProgress":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold px-2.5 py-0.5 select-none">
            <Clock className="h-3 w-3 mr-1" />
            Đang di chuyển
          </Badge>
        );
      case "Completed":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2.5 py-0.5 select-none">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
            Đã hoàn thành
          </Badge>
        );
      case "Failed":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold px-2.5 py-0.5 select-none">
            <AlertCircle className="h-3 w-3 mr-1 text-rose-500" />
            Thất bại (Failed)
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 bg-card border border-muted p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tác vụ theo Task ID, SKU, mã đơn Nhập/Xuất, ô kệ bin..."
            className="pl-10 bg-background border-muted h-9 rounded-lg text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main DataTable Card */}
      <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-bold w-[130px]">Mã Tác Vụ</TableHead>
              <TableHead className="font-bold">Mã SKU Sản Phẩm</TableHead>
              <TableHead className="font-bold text-right w-[90px]">SL</TableHead>
              <TableHead className="font-bold">Từ Phiếu Nhập (Inbound)</TableHead>
              <TableHead className="font-bold">Sang Đơn Xuất (Outbound)</TableHead>
              <TableHead className="font-bold">Chỉ Dẫn Luân Chuyển (Bin)</TableHead>
              <TableHead className="font-bold w-[180px]">Trạng Thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs italic">
                  Không tìm thấy tác vụ luân chuyển nhanh nào khớp điều kiện lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/15 transition-colors">
                  <TableCell className="font-mono font-bold text-xs py-3.5 align-middle">
                    {t.id}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs align-middle">
                    {t.sku}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-xs align-middle">
                    {t.quantity}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground align-middle">
                    {t.inboundReceiptId}
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-xs text-primary align-middle">
                    {t.outboundOrderId}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-muted/80">
                        {t.inboundStagingBinCode}
                      </span>
                      <MoveRight className="h-3 w-3 text-muted-foreground" />
                      <span className="bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-950/60">
                        {t.outboundStagingBinCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    {formatStatusBadge(t.status)}
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
