'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Package,
  Barcode,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Scale,
  Banknote,
  Truck,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

import type { OrderDto, OrderStatusHistoryDto, OrderSummaryDto } from '@/types/oms';
import { StatusBadge } from '@/components/portal/status-badge';
import { OrderTimeline } from '@/components/portal/order-timeline';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/card';
import { Badge } from '@repo/ui/components/badge';
import { fetchApi } from '@/lib/api-client';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'HH:mm - dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

// Status progress steps for visual progress bar
const progressSteps = [
  { statuses: ['New', 'Confirmed'], label: 'Tiếp nhận', icon: CheckCircle2 },
  { statuses: ['AwaitingPickup', 'PickedUp'], label: 'Lấy hàng', icon: Package },
  { statuses: ['AwaitingInbound', 'InWarehouse', 'Sorting', 'AwaitingDispatch'], label: 'Xử lý kho', icon: MapPin },
  { statuses: ['Dispatched', 'Delivering'], label: 'Giao hàng', icon: Truck },
  { statuses: ['Delivered', 'Completed'], label: 'Hoàn thành', icon: CheckCircle2 },
];

function getProgressStep(status: string): number {
  for (let i = 0; i < progressSteps.length; i++) {
    if (progressSteps[i].statuses.includes(status)) return i;
  }
  return -1; // Cancelled / Failed / ReturnInTransit
}

export default function TrackingPage() {
  const [waybillCode, setWaybillCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [timeline, setTimeline] = useState<OrderStatusHistoryDto[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = waybillCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError(null);
    setOrder(null);
    setTimeline([]);
    setSearched(false);

    try {
      // Dùng fetchApi (có JWT token từ session) để gọi API OMS
      const listRes = await fetchApi<{ isSuccess: boolean; value: { items: OrderSummaryDto[] } }>(
        'oms',
        `/orders?searchTerm=${encodeURIComponent(code)}&pageSize=10`
      );

      const items = listRes?.value?.items ?? [];
      // Tìm đúng mã vận đơn (case-insensitive)
      const match = items.find(
        (o) => o.waybillCode?.toUpperCase() === code
      );

      if (!match) {
        setError(`Không tìm thấy đơn hàng với mã vận đơn "${code}". Vui lòng kiểm tra lại.`);
        setSearched(true);
        return;
      }

      // Load chi tiết đơn + lịch sử song song
      const [detailRes, historyRes] = await Promise.all([
        fetchApi<{ isSuccess: boolean; value: OrderDto }>('oms', `/orders/${match.id}`),
        fetchApi<{ isSuccess: boolean; value: OrderStatusHistoryDto[] }>('oms', `/orders/${match.id}/status-history`),
      ]);

      if (detailRes?.isSuccess && detailRes.value) {
        setOrder(detailRes.value);
      }
      if (historyRes?.isSuccess && historyRes.value) {
        setTimeline(historyRes.value ?? []);
      }

      setSearched(true);
    } catch (err: any) {
      console.error('Tracking error:', err);
      setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const progressStep = order ? getProgressStep(order.status) : -1;
  const isFinalBad = order && ['Cancelled', 'Failed', 'ReturnInTransit'].includes(order.status);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Barcode className="size-4 text-white" />
          </div>
          Theo dõi đơn hàng
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Nhập mã vận đơn để xem trạng thái và lịch sử vận chuyển
        </p>
      </div>

      {/* Search box */}
      <Card className="shadow-sm rounded-xl overflow-hidden border-2">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500" />
        <CardContent className="pt-5 pb-5">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                value={waybillCode}
                onChange={(e) => {
                  setWaybillCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="VD: LMS240601000001"
                className="pl-11 h-12 text-base font-mono tracking-wider uppercase"
                maxLength={25}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !waybillCode.trim()}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white gap-2 font-semibold shadow-sm"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Search className="size-5" />
              )}
              Tra cứu
            </Button>
          </form>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <p className="mt-3 text-xs text-center text-muted-foreground">
            Mã vận đơn có dạng <span className="font-mono font-medium">LMS + 12 chữ số</span>
          </p>
        </CardContent>
      </Card>

      {/* Result */}
      {order && (
        <div className="space-y-5">
          {/* Order summary card */}
          <Card className="rounded-xl shadow-md overflow-hidden">
            <div className={`h-1.5 ${isFinalBad ? 'bg-destructive' : 'bg-gradient-to-r from-blue-500 to-violet-500'}`} />
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-bold font-mono tracking-widest text-blue-700 dark:text-blue-400">
                      {order.waybillCode}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    Tạo lúc {formatDate(order.createdAt)}
                  </p>
                  {order.lastModifiedAt && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <RefreshCw className="size-3.5" />
                      Cập nhật {formatDate(order.lastModifiedAt)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span className="font-medium">{order.consignee?.fullName}</span>
                    {order.consignee?.address?.city && (
                      <span className="text-muted-foreground">· {order.consignee.address.city}</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(order.codAmount)}</p>
                  <p className="text-xs text-muted-foreground">COD</p>
                  <p className="text-sm text-muted-foreground mt-1">{order.weight} kg</p>
                </div>
              </div>

              {/* Progress bar */}
              {!isFinalBad && progressStep >= 0 && (
                <div className="mt-5 pt-5 border-t">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted mx-8" />
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 mx-8 transition-all duration-700"
                      style={{ right: `${(1 - progressStep / (progressSteps.length - 1)) * 100 * 0.84}%` }}
                    />
                    {progressSteps.map((step, idx) => {
                      const Icon = step.icon;
                      const isDone = idx <= progressStep;
                      const isCurrent = idx === progressStep;
                      return (
                        <div key={step.label} className="flex flex-col items-center gap-2 z-10">
                          <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-all ${
                            isDone ? isCurrent
                              ? 'bg-violet-600 border-violet-600 shadow-lg shadow-violet-500/30 scale-110'
                              : 'bg-blue-600 border-blue-600'
                            : 'bg-background border-muted'
                          }`}>
                            <Icon className={`size-4 ${isDone ? 'text-white' : 'text-muted-foreground'}`} />
                          </div>
                          <span className={`text-[10px] font-medium text-center max-w-[56px] hidden sm:block ${
                            isDone ? isCurrent ? 'text-violet-700 dark:text-violet-400' : 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {isFinalBad && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="size-4" />
                  {order.status === 'Cancelled' && 'Đơn hàng đã bị hủy.'}
                  {order.status === 'Failed' && `Giao hàng thất bại. ${order.failureReason ?? ''}`}
                  {order.status === 'ReturnInTransit' && 'Kiện hàng đang trên đường hoàn trả.'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two column: Info + Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Consignee info */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Thông tin người nhận
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {order.consignee?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{order.consignee?.fullName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3" />
                      {order.consignee?.phone}
                    </p>
                  </div>
                </div>
                {order.consignee?.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="size-4 mt-0.5 shrink-0 text-emerald-500" />
                    <span>
                      {[order.consignee.address.street, order.consignee.address.city, order.consignee.address.state]
                        .filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-0.5">Trọng lượng</p>
                    <p className="font-semibold text-sm flex items-center justify-center gap-1">
                      <Scale className="size-3.5" />{order.weight} kg
                    </p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground mb-0.5">COD</p>
                    <p className="font-semibold text-sm flex items-center justify-center gap-1 text-emerald-600">
                      <Banknote className="size-3.5" />{formatCurrency(order.codAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  Lịch sử vận chuyển
                  <Badge variant="secondary" className="text-xs font-normal">
                    {timeline.length} bước
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 max-h-[380px] overflow-y-auto">
                <OrderTimeline events={timeline} currentStatus={order.status} />
              </CardContent>
            </Card>
          </div>

          {/* Quick link to detail page */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={`/portal/orders/${order.id}`}>
                Xem chi tiết đầy đủ <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Empty state after search */}
      {searched && !order && !error && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="size-12 mx-auto mb-3 opacity-30" />
          <p>Không tìm thấy kết quả</p>
        </div>
      )}

      {/* Initial placeholder */}
      {!searched && !loading && (
        <div className="text-center py-10 text-muted-foreground space-y-3">
          <div className="flex justify-center gap-2 text-4xl">📦🚚✅</div>
          <p className="text-sm">Nhập mã vận đơn ở trên để tra cứu trạng thái kiện hàng</p>
          <p className="text-xs text-muted-foreground/60">
            Chỉ hiển thị đơn hàng thuộc tài khoản của bạn
          </p>
        </div>
      )}
    </div>
  );
}
