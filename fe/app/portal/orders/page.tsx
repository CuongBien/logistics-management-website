'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Eye, PlusCircle } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

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

const PAGE_SIZE = 10;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      if (search) params.append('searchTerm', search);
      const mappedStatusFilter = statusFilter === ('__all' as any) ? '' : statusFilter;
      if (mappedStatusFilter) params.append('status', mappedStatusFilter);

      const res = await fetchApi<{
        isSuccess: boolean;
        value: { items: OrderSummaryDto[]; totalPages: number; totalCount: number; pageIndex: number };
      }>('oms', `/orders?${params.toString()}`);

      if (res && res.isSuccess && res.value) {
        setOrders(res.value.items || []);
        setTotalPages(res.value.totalPages || 1);
        setTotalCount(res.value.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusFilter]);

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

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
      ) : orders.length > 0 ? (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">
              {totalCount} đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead className="hidden md:table-cell">Số điện thoại</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Trọng lượng</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày tạo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.waybillCode}</TableCell>
                    <TableCell>{order.consigneeName}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{order.consigneePhone}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right">{order.weight} kg</TableCell>
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
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <PlusCircle className="size-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">Không có đơn hàng nào</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Bạn chưa có đơn hàng nào khớp với tìm kiếm, hoặc chưa tạo đơn hàng nào.
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
