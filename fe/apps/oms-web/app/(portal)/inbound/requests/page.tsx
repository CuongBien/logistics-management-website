'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Search,
  Eye,
  PlusCircle,
  RefreshCw,
  Package,
  MapPin,
  Barcode,
  ArrowDownCircle,
} from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

import type { OrderSummaryDto, OrderStatus, PaginatedList, ApiResult } from '@/types/oms';
import { StatusBadge } from '@/components/portal/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Skeleton } from '@repo/ui/components/skeleton';

const inboundStatusOptions: { value: string; label: string }[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'New', label: '🔵 Chờ tiếp nhận' },
  { value: 'Confirmed', label: '🔷 Đã tiếp nhận' },
  { value: 'AwaitingInbound', label: '🩵 Đang vận chuyển tới kho' },
  { value: 'InWarehouse', label: '🟢 Đã nhập kho' },
  { value: 'Completed', label: '✅ Hoàn thành' },
  { value: 'Cancelled', label: '🚫 Đã hủy' },
];

const PAGE_SIZE = 10;

function TableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-7 w-7 rounded" /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

export default function InboundRequestsPage() {
  const [requests, setRequests] = useState<OrderSummaryDto[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
        type: 'InboundRequest', // Explicit filter for Inbound Requests
      });
      if (debouncedSearch) params.append('searchTerm', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetchApi<ApiResult<PaginatedList<OrderSummaryDto>>>(
        'oms',
        `/orders?${params.toString()}`
      );

      if (res?.isSuccess && res.value) {
        setRequests(res.value.items || []);
        setTotalPages(res.value.totalPages || 1);
        setTotalCount(res.value.totalCount || 0);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Failed to load inbound requests', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const activeFilterCount = [debouncedSearch, statusFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowDownCircle className="h-6 w-6 text-blue-600" />
            Yêu cầu nhập kho
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Quản lý và tạo yêu cầu gửi sản phẩm của bạn vào kho lưu trữ
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-1.5 shadow-sm">
            <Link href="/inbound/requests/create">
              <PlusCircle className="size-4" /> Tạo yêu cầu nhập kho
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm rounded-xl">
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã yêu cầu hoặc mã vận đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === '__all' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {inboundStatusOptions.map((opt) => (
                  <SelectItem key={opt.value || '__all'} value={opt.value || '__all'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Đang lọc:</span>
              {debouncedSearch && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Search className="size-3" /> "{debouncedSearch}"
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary" className="text-xs">
                  {inboundStatusOptions.find(o => o.value === statusFilter)?.label}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground px-2"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {(loading || requests.length > 0) ? (
        <Card className="shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {loading ? 'Đang tải...' : `${totalCount} yêu cầu`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="pl-5 font-semibold">Mã yêu cầu</TableHead>
                  <TableHead className="font-semibold">Kho nhận</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold">Trọng lượng</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">Ngày tạo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>

              {loading ? (
                <TableSkeleton />
              ) : (
                <TableBody>
                  {requests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="size-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-mono font-semibold text-sm text-indigo-700 dark:text-indigo-400">
                            {req.waybillCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-red-500 shrink-0" />
                          <span className="text-sm font-medium">{req.destinationWarehouseId || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {req.weight} kg
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status as OrderStatus} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {format(new Date(req.createdAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="pr-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link href={`/orders/${req.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Trang <strong>{page}</strong> / {totalPages} · {totalCount} kết quả
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Trước
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === page ? 'default' : 'outline'}
                          size="sm"
                          className={`w-9 ${pageNum === page ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white' : ''}`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Sau →
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Empty state */
        <Card className="shadow-sm rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-4">
              <Package className="size-10 text-indigo-500/60" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {activeFilterCount > 0 ? 'Không có kết quả' : 'Chưa có yêu cầu nhập kho nào'}
            </h2>
            <p className="text-muted-foreground max-w-md mb-6 text-sm">
              {activeFilterCount > 0
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm kết quả.'
                : 'Bạn chưa tạo yêu cầu nhập kho nào. Hãy bắt đầu bằng cách gửi yêu cầu nhập kho đầu tiên!'}
            </p>
            {activeFilterCount > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
              >
                Xóa bộ lọc
              </Button>
            ) : (
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-1.5 shadow-md"
              >
                <Link href="/inbound/requests/create">
                  <PlusCircle className="size-4" /> Lên yêu cầu nhập kho ngay
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
