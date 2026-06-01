'use client'

import { useState, useEffect } from 'react'
import { fetchApi } from '@/lib/api-client'
import type { OrderSummaryDto } from '@/types/oms'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Wallet,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Eye,
  FileText,
} from 'lucide-react'

interface ReconciliationSession {
  id: string
  sessionNo: string
  createdAt: string
  period: string
  orderCount: number
  totalCod: number
  totalFee: number
  netAmount: number
  status: 'Paid' | 'Processing' | 'Pending'
  paymentMethod: string
}

export default function ReconciliationPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<ReconciliationSession | null>(null)
  
  const [sessions, setSessions] = useState<ReconciliationSession[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalCod: 0, paidCod: 0, pendingCod: 0, totalFee: 0 })

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const res = await fetchApi<{
          isSuccess: boolean;
          value: { items: OrderSummaryDto[]; totalCount: number };
        }>('oms', `/orders?pageSize=200`)
        
        if (res && res.isSuccess && res.value) {
          const list = res.value.items || []
          
          // Compute overall stats
          const deliveredOrders = list.filter(o => o.status === 'Delivered' || o.status === 'Completed')
          const pendingOrders = list.filter(o => !['Delivered', 'Completed', 'Cancelled', 'Failed'].includes(o.status))
          
          const paidCod = deliveredOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0)
          const pendingCod = pendingOrders.reduce((sum, o) => sum + (o.codAmount || 0), 0)
          const totalCod = paidCod + pendingCod
          
          const totalFee = list.reduce((sum, o) => sum + ((o.weight || 0) * 5000 + 15000), 0)
          const paidFee = deliveredOrders.reduce((sum, o) => sum + ((o.weight || 0) * 5000 + 15000), 0)
          
          setStats({ totalCod, paidCod, pendingCod, totalFee })
          
          // Generate simulated sessions based on real data
          if (list.length > 0) {
             const session1: ReconciliationSession = {
                id: 'RC-REAL-1',
                sessionNo: `RC${new Date().toISOString().slice(2,10).replace(/-/g, '')}01`,
                createdAt: new Date().toISOString(),
                period: 'Tháng này',
                orderCount: deliveredOrders.length,
                totalCod: paidCod,
                totalFee: paidFee,
                netAmount: paidCod - paidFee,
                status: paidCod > 0 ? 'Processing' : 'Pending',
                paymentMethod: 'Chuyển khoản Ngân hàng (VCB)'
             }
             setSessions([session1])
          }
        }
      } catch (err) {
        console.error('Failed to load orders for reconciliation', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.sessionNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đối soát tài chính</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý dòng tiền, tiền thu hộ COD và chi phí dịch vụ vận chuyển.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
          <Download className="mr-2 size-4" /> Xuất báo cáo tài chính
        </Button>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total COD */}
        <Card className="relative overflow-hidden border-t-4 border-t-blue-500 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tổng tiền COD đã thu</p>
                <p className="text-2xl font-bold text-blue-600">{formatVND(stats.totalCod)}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Wallet className="size-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <ArrowDownLeft className="mr-1 size-4 text-emerald-500" />
              <span className="font-semibold text-emerald-500">+18.2%</span>
              <span className="ml-1">so với tháng trước</span>
            </div>
          </CardContent>
        </Card>

        {/* Paid COD */}
        <Card className="relative overflow-hidden border-t-4 border-t-emerald-500 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Đã thanh toán (Thực nhận)</p>
                <p className="text-2xl font-bold text-emerald-600">{formatVND(stats.paidCod)}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-500">1 phiên</span>
              <span className="ml-1">đã hoàn tất chuyển khoản</span>
            </div>
          </CardContent>
        </Card>

        {/* Awaiting Reconciliation */}
        <Card className="relative overflow-hidden border-t-4 border-t-amber-500 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">COD chờ đối soát</p>
                <p className="text-2xl font-bold text-amber-600">{formatVND(stats.pendingCod)}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Clock className="size-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="font-semibold text-amber-500">0 phiên</span>
              <span className="ml-1">đang chờ đối soát kì mới</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Service Fees */}
        <Card className="relative overflow-hidden border-t-4 border-t-violet-500 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Cước phí vận chuyển</p>
                <p className="text-2xl font-bold text-violet-600">{formatVND(stats.totalFee)}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <ArrowUpRight className="size-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="font-semibold text-muted-foreground">~8.1%</span>
              <span className="ml-1">tỉ lệ phí trên tổng COD</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session List Table */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Lịch sử kỳ đối soát</CardTitle>
          <CardDescription>Danh sách chi tiết các phiên đối soát dòng tiền định kỳ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã phiên đối soát..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Paid">Đã thanh toán</SelectItem>
                  <SelectItem value="Processing">Đang xử lý</SelectItem>
                  <SelectItem value="Pending">Chờ thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Mã phiên</TableHead>
                  <TableHead>Chu kỳ đối soát</TableHead>
                  <TableHead className="text-center">Số lượng đơn</TableHead>
                  <TableHead className="text-right">Tổng tiền COD</TableHead>
                  <TableHead className="text-right">Phí dịch vụ</TableHead>
                  <TableHead className="text-right font-medium">Thực nhận</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <TableRow key={session.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{session.sessionNo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{session.period}</TableCell>
                      <TableCell className="text-center font-medium">{session.orderCount}</TableCell>
                      <TableCell className="text-right text-blue-600 font-semibold">
                        {formatVND(session.totalCod)}
                      </TableCell>
                      <TableCell className="text-right text-rose-500">
                        -{formatVND(session.totalFee)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-bold">
                        {formatVND(session.netAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={
                            session.status === 'Paid'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : session.status === 'Processing'
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                              : 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          }
                        >
                          ●{' '}
                          {session.status === 'Paid'
                            ? 'Đã thanh toán'
                            : session.status === 'Processing'
                            ? 'Đang xử lý'
                            : 'Chờ thanh toán'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Xem chi tiết"
                            onClick={() => setSelectedSession(session)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Tải hóa đơn PDF">
                            <FileText className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Không tìm thấy dữ liệu đối soát phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Session Details Dialog/Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl rounded-xl shadow-2xl border-none">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Chi tiết phiên đối soát</CardTitle>
                  <CardDescription className="text-blue-100 text-xs">
                    Phiên: {selectedSession.sessionNo} | Kì đối soát: {selectedSession.period}
                  </CardDescription>
                </div>
                <Badge className="bg-white/20 text-white border-none">
                  {selectedSession.status === 'Paid'
                    ? 'Đã hoàn tất'
                    : selectedSession.status === 'Processing'
                    ? 'Đang xử lý'
                    : 'Chờ xử lý'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Tổng tiền COD đã thu:</span>
                  <p className="text-lg font-bold text-blue-600">{formatVND(selectedSession.totalCod)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Phí dịch vụ vận chuyển:</span>
                  <p className="text-lg font-bold text-rose-500">-{formatVND(selectedSession.totalFee)}</p>
                </div>
                <div className="col-span-2 border-t pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Số tiền thực chuyển nhận:</span>
                    <p className="text-xl font-bold text-emerald-600">{formatVND(selectedSession.netAmount)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-medium">Phương thức:</span>
                    <p className="text-xs font-semibold text-muted-foreground">{selectedSession.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Sample Detail Order lines */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Danh sách đơn hàng trong phiên</h3>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-muted/20 space-y-1.5">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-xs p-2 rounded hover:bg-card border border-transparent hover:border-border"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-medium text-foreground">
                          SH24060100{idx}
                        </span>
                        <p className="text-[10px] text-muted-foreground">Người nhận: Nguyễn Văn {idx}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-blue-600">COD: {formatVND(1200000 * idx)}</span>
                        <p className="text-[10px] text-rose-500">Phí: -35.000₫</p>
                      </div>
                    </div>
                  ))}
                  <p className="text-center text-[10px] text-muted-foreground pt-1">
                    ... và {selectedSession.orderCount - 3} đơn hàng khác
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Đóng
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                  <Download className="mr-2 size-4" /> Tải bảng kê chi tiết
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
