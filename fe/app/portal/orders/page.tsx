'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Eye, PlusCircle } from 'lucide-react';

import type { OrderSummaryDto, OrderStatus } from '@/types/oms';
import { StatusBadge } from '@/components/portal/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusOptions: { value: OrderStatus | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'New', label: 'Mới' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'AwaitingPickup', label: 'Chờ lấy hàng' },
  { value: 'PickedUp', label: 'Đã lấy hàng' },
  { value: 'AwaitingInbound', label: 'Chờ nhập kho' },
  { value: 'InWarehouse', label: 'Trong kho' },
  { value: 'Sorting', label: 'Đang phân loại' },
  { value: 'AwaitingDispatch', label: 'Chờ xuất kho' },
  { value: 'Dispatched', label: 'Đã xuất kho' },
  { value: 'Delivering', label: 'Đang giao' },
  { value: 'Delivered', label: 'Đã giao' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Failed', label: 'Thất bại' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'ReturnInTransit', label: 'Đang hoàn trả' },
];

const PAGE_SIZE = 5;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const currentPhone = localStorage.getItem('shiphub_current_phone') || '0901234567';
    const ordersKey = `shiphub_orders_${currentPhone}`;
    const saved = localStorage.getItem(ordersKey);
    const list: OrderSummaryDto[] = saved ? JSON.parse(saved) : [];
    setOrders(list);
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        o.consigneeName.toLowerCase().includes(search.toLowerCase());
      
      // Select uses "__all" for empty status option in Radix select value mapping
      const mappedStatusFilter = statusFilter === ('__all' as any) ? '' : statusFilter;
      const matchStatus = !mappedStatusFilter || o.status === mappedStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đơn hàng của tôi</h1>
          <p className="text-muted-foreground">Quản lý và theo dõi tất cả đơn hàng của bạn</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 gap-1.5 shadow-sm">
          <Link href="/portal/orders/create">
            <PlusCircle className="size-4" /> Tạo đơn hàng mới
          </Link>
        </Button>
      </div>

      {orders.length > 0 ? (
        <>
          {/* Filters */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo mã đơn hoặc tên người nhận..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v as OrderStatus | '');
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value || '__all'} value={opt.value || '__all'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">
                {filtered.length} đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Người nhận</TableHead>
                    <TableHead className="hidden md:table-cell">Thành phố</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Trọng lượng</TableHead>
                    <TableHead className="text-right">COD</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="hidden sm:table-cell">Ngày tạo</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">{order.orderNo}</TableCell>
                        <TableCell>{order.consigneeName}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{order.consigneeCity}</TableCell>
                        <TableCell className="hidden lg:table-cell text-right">{order.totalWeight} kg</TableCell>
                        <TableCell className="text-right">
                          {order.codAmount > 0 ? formatCurrency(order.codAmount) : '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(new Date(order.createdAt), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/portal/orders/${order.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PlusCircle className="size-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">Bạn chưa có đơn hàng nào</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Shop của bạn mới được đăng ký và chưa thực hiện bất kỳ giao dịch gửi hàng nào. Hãy bắt đầu bằng cách tạo một đơn hàng đầu tiên của bạn!
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 gap-1.5 shadow-md">
              <Link href="/portal/orders/create">
                <PlusCircle className="size-4" /> Lên đơn hàng ngay
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
