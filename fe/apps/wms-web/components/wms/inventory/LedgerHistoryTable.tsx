"use client"

import { InventoryLedgerDto, LedgerTransactionType } from "@/types/wms-inventory"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table"
import { Badge } from "@repo/ui/components/badge"
import { format } from "date-fns"
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, History } from "lucide-react"

interface LedgerHistoryTableProps {
  ledgers: InventoryLedgerDto[]
}

export function LedgerHistoryTable({ ledgers }: LedgerHistoryTableProps) {
  
  // Format transaction type helper
  const formatTxType = (type: LedgerTransactionType) => {
    switch (type) {
      case 'Receipt':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">Nhập kho (Receipt)</Badge>;
      case 'Putaway':
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold">Cất hàng (Putaway)</Badge>;
      case 'Pick':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold">Lấy hàng (Pick)</Badge>;
      case 'Pack':
        return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20 font-bold">Đóng gói (Pack)</Badge>;
      case 'Ship':
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold">Xuất kho (Ship)</Badge>;
      case 'Adjust':
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 font-bold">Điều chỉnh (Adjust)</Badge>;
      case 'Transfer':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">Luân chuyển (Transfer)</Badge>;
      case 'CycleCount':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold">Kiểm kê (CycleCount)</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  }

  // Sort ledgers descending by occurredAt
  const sortedLedgers = [...ledgers].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  return (
    <div className="border border-muted rounded-xl overflow-hidden shadow-sm bg-card">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold">Ngày Giờ</TableHead>
            <TableHead className="font-bold">Loại Giao Dịch</TableHead>
            <TableHead className="font-bold text-right">Biến Động (Delta)</TableHead>
            <TableHead className="font-bold text-right">Tồn Sau Giao Dịch</TableHead>
            <TableHead className="font-bold text-center">Mã Tham Chiếu (Ref)</TableHead>
            <TableHead className="font-bold">Người Thực Hiện</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLedgers.map((l) => {
            const isPositive = l.deltaQty > 0
            const isNegative = l.deltaQty < 0

            return (
              <TableRow key={l.id} className="hover:bg-muted/15 transition-colors">
                {/* Date time */}
                <TableCell className="align-middle font-mono text-xs py-3.5">
                  {format(new Date(l.occurredAt), "dd/MM/yyyy HH:mm:ss")}
                </TableCell>

                {/* Transaction type */}
                <TableCell className="align-middle py-3.5">
                  {formatTxType(l.transactionType)}
                </TableCell>

                {/* Qty delta */}
                <TableCell className="align-middle text-right py-3.5">
                  {isPositive && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                      +{l.deltaQty.toLocaleString()}
                    </span>
                  )}
                  {isNegative && (
                    <span className="inline-flex items-center gap-0.5 text-rose-500 dark:text-rose-400 font-extrabold font-mono bg-rose-500/10 px-2 py-0.5 rounded">
                      <ArrowDownRight className="h-3.5 w-3.5 shrink-0" />
                      {l.deltaQty.toLocaleString()}
                    </span>
                  )}
                  {l.deltaQty === 0 && (
                    <span className="inline-flex items-center gap-0.5 text-slate-500 font-bold font-mono bg-slate-500/10 px-2 py-0.5 rounded">
                      <RefreshCw className="h-3 w-3 shrink-0" />
                      0
                    </span>
                  )}
                </TableCell>

                {/* Balance after */}
                <TableCell className="align-middle text-right font-extrabold font-mono py-3.5">
                  {l.balanceAfter.toLocaleString()}
                </TableCell>

                {/* Reference ID */}
                <TableCell className="align-middle text-center font-mono text-xs text-muted-foreground py-3.5">
                  {l.referenceId || "—"}
                </TableCell>

                {/* Operator */}
                <TableCell className="align-middle font-mono text-xs text-muted-foreground py-3.5">
                  {l.operatorId}
                </TableCell>
              </TableRow>
            )
          })}

          {sortedLedgers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center py-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Chưa có lịch sử giao dịch sổ cái cho lô hàng này.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
