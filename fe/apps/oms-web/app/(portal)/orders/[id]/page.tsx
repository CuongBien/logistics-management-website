'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Phone,
  FileText,
  Scale,
  Banknote,
  Loader2,
  Hash,
  Barcode,
  Truck,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

import type { OrderDto, OrderStatusHistoryDto } from '@/types/oms';
import { StatusBadge } from '@/components/portal/status-badge';
import { OrderTimeline } from '@/components/portal/order-timeline';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Separator } from '@repo/ui/components/separator';
import { Badge } from '@repo/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@repo/ui/components/dialog';
import { toast } from 'sonner';
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

function InfoRow({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-dashed border-muted/50 last:border-0">
      <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className={`text-sm font-medium break-words ${valueClass ?? ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, iconBg, iconColor }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <CardTitle className="text-base flex items-center gap-2">
      <div className={`size-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        <Icon className={`size-4 ${iconColor}`} />
      </div>
      {title}
    </CardTitle>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<OrderStatusHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderRes, historyRes] = await Promise.all([
        fetchApi<{ isSuccess: boolean; value: OrderDto }>('oms', `/orders/${id}`),
        fetchApi<{ isSuccess: boolean; value: OrderStatusHistoryDto[] }>('oms', `/orders/${id}/status-history`),
      ]);

      if (orderRes?.isSuccess && orderRes.value) {
        setOrder(orderRes.value);
      }
      if (historyRes?.isSuccess && historyRes.value) {
        setTimelineEvents(historyRes.value);
      }
    } catch (error) {
      console.error('Failed to load order details', error);
      toast.error('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // Cancel order: backend uses PUT /orders/{id}/actions/cancel
  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetchApi<{ isSuccess: boolean; error?: { message: string } }>(
        'oms',
        `/orders/${id}/actions/cancel`,
        {
          method: 'PUT',
          body: { reason: 'Khách hàng yêu cầu hủy' },
        }
      );
      if (res?.isSuccess) {
        toast.success('Đơn hàng đã được hủy thành công');
        setCancelOpen(false);
        await loadData();
      } else {
        toast.error(res?.error?.message ?? 'Không thể hủy đơn hàng');
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Lỗi khi hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center gap-3">
        <Loader2 className="size-10 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="size-20 rounded-full bg-muted flex items-center justify-center">
          <Package className="size-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-bold">Không tìm thấy đơn hàng</h2>
        <p className="text-muted-foreground max-w-sm">
          Đơn hàng bạn yêu cầu không tồn tại hoặc bạn không có quyền xem.
        </p>
        <Button asChild>
          <Link href="/orders">
            <ArrowLeft className="size-4 mr-1" />
            Quay lại danh sách
          </Link>
        </Button>
      </div>
    );
  }

  const canCancel = order.status === 'New' || order.status === 'AwaitingPickup';

  // Build full address from consignee
  const consigneeAddress = [
    order.consignee?.address?.street,
    order.consignee?.address?.city,
    order.consignee?.address?.state,
  ]
    .filter(Boolean)
    .join(', ');

  const fulfillmentLabel = order.fulfillment === 'Pickup' ? 'Lấy tại nhà' : 'Gửi tại kho';
  const typeLabel = order.type === 'Parcel' ? 'Kiện hàng thường' : 'Gửi vào kho';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + Refresh */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/orders">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={loadData}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </div>

      {/* Header */}
      <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Barcode className="size-5 text-blue-600" />
                <span className="text-lg font-bold font-mono tracking-widest text-blue-700 dark:text-blue-400">
                  {order.waybillCode}
                </span>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                Tạo lúc {formatDate(order.createdAt)}
              </span>
              {order.lastModifiedAt && (
                <span className="flex items-center gap-1">
                  <RefreshCw className="size-3.5" />
                  Cập nhật {formatDate(order.lastModifiedAt)}
                </span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                🚚 {fulfillmentLabel}
              </Badge>
              <Badge variant="outline" className="text-xs">
                📦 {typeLabel}
              </Badge>
              {order.deliveryAttempts > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                  Đã thử giao: {order.deliveryAttempts} lần
                </Badge>
              )}
            </div>
          </div>

          <div className="text-right space-y-1">
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(order.codAmount)}
            </p>
            <p className="text-xs text-muted-foreground">Tiền thu hộ (COD)</p>
          </div>
        </div>

        {order.failureReason && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-100 dark:bg-red-900/20 px-3 py-2.5 text-sm text-red-700 dark:text-red-400">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>{order.failureReason}</span>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left – Order info */}
        <div className="lg:col-span-3 space-y-5">

          {/* Người nhận */}
          <Card className="shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={MapPin}
                title="Thông tin người nhận"
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-600"
              />
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow icon={User} label="Họ tên" value={order.consignee?.fullName ?? '—'} valueClass="text-base font-semibold" />
              <InfoRow icon={Phone} label="Số điện thoại" value={order.consignee?.phone ?? '—'} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={consigneeAddress || '—'} />
              {order.consignee?.address?.state && (
                <InfoRow icon={MapPin} label="Tỉnh/Thành phố" value={order.consignee.address.state} />
              )}
            </CardContent>
          </Card>

          {/* Thông tin kiện hàng */}
          <Card className="shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={Package}
                title="Thông tin kiện hàng"
                iconBg="bg-violet-500/10"
                iconColor="text-violet-600"
              />
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <InfoRow icon={Scale} label="Trọng lượng" value={`${order.weight} kg`} />
                <InfoRow icon={Banknote} label="Tiền thu hộ (COD)" value={formatCurrency(order.codAmount)} valueClass="text-emerald-600 font-bold" />
                <InfoRow icon={Truck} label="Phí vận chuyển" value={formatCurrency(order.shippingFee)} />
                {order.note && (
                  <InfoRow icon={FileText} label="Ghi chú" value={order.note} />
                )}
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      Danh sách sản phẩm ({order.items.length})
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Hash className="size-3.5 text-muted-foreground" />
                            <span className="font-mono font-medium">{item.skuCode || 'SKU không xác định'}</span>
                          </div>
                          <div className="text-right text-muted-foreground">
                            <span>×{item.quantity}</span>
                            {item.price > 0 && (
                              <span className="ml-2">{formatCurrency(item.price)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tracking nội bộ (nếu có) */}
          {(order.warehouseId || order.pickupDriverId || order.deliveryDriverId || order.routeId) && (
            <Card className="shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-3">
                <SectionHeader
                  icon={Truck}
                  title="Thông tin vận chuyển"
                  iconBg="bg-blue-500/10"
                  iconColor="text-blue-600"
                />
              </CardHeader>
              <CardContent className="space-y-0">
                {order.warehouseId && (
                  <InfoRow icon={MapPin} label="Kho xử lý" value={order.warehouseId} />
                )}
                {order.destinationWarehouseId && (
                  <InfoRow icon={MapPin} label="Kho đích" value={order.destinationWarehouseId} />
                )}
                {order.pickupDriverId && (
                  <InfoRow icon={User} label="Tài xế lấy hàng" value={order.pickupDriverId} />
                )}
                {order.deliveryDriverId && (
                  <InfoRow icon={User} label="Tài xế giao hàng" value={order.deliveryDriverId} />
                )}
                {order.routeId && (
                  <InfoRow icon={Truck} label="Tuyến đường" value={order.routeId} />
                )}
                {order.proofOfDeliveryUrl && (
                  <div className="flex items-start gap-3 py-2.5">
                    <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Ảnh giao hàng (POD)</p>
                      <a
                        href={order.proofOfDeliveryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Xem ảnh <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right – Timeline + Actions */}
        <div className="lg:col-span-2 space-y-5">

          {/* Timeline */}
          <Card className="shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="size-4 text-orange-600" />
                </div>
                Lịch sử vận chuyển
                {timelineEvents.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {timelineEvents.length} bước
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline events={timelineEvents} currentStatus={order.status} />
            </CardContent>
          </Card>

          {/* Cancel action */}
          {canCancel && (
            <Card className="shadow-sm rounded-xl border-destructive/30 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-500 to-rose-500" />
              <CardContent className="pt-5">
                <div className="flex items-start gap-2 mb-4">
                  <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Bạn có thể hủy đơn hàng khi trạng thái còn ở{' '}
                    <strong className="text-foreground">Mới tạo</strong> hoặc{' '}
                    <strong className="text-foreground">Chờ lấy hàng</strong>.
                    Sau khi hủy, thao tác này không thể hoàn tác.
                  </p>
                </div>

                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-1.5" size="sm">
                      Hủy đơn hàng này
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
                      <DialogDescription>
                        Bạn có chắc chắn muốn hủy đơn hàng{' '}
                        <strong className="font-mono text-foreground">{order.waybillCode}</strong>?{' '}
                        Hành động này <strong className="text-destructive">không thể hoàn tác</strong>.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <DialogClose asChild>
                        <Button variant="outline" disabled={cancelling}>
                          Không, giữ lại
                        </Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={cancelling}
                        className="gap-1.5"
                      >
                        {cancelling && <Loader2 className="size-4 animate-spin" />}
                        Có, hủy đơn
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* External reference */}
          {order.externalReference && (
            <Card className="shadow-sm rounded-xl overflow-hidden">
              <CardContent className="pt-5">
                <p className="text-xs text-muted-foreground mb-1">Mã đơn ngoài hệ thống</p>
                <p className="font-mono text-sm font-medium">{order.externalReference}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
