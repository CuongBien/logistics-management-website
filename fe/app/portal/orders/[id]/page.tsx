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
  Weight,
  Banknote,
  Loader2,
} from 'lucide-react';

import type { OrderDto, OrderStatusHistoryDto } from '@/types/oms';
import { StatusBadge } from '@/components/portal/status-badge';
import { OrderTimeline } from '@/components/portal/order-timeline';
import { ShippingLabelDialog } from '@/components/portal/shipping-label-dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchApi } from '@/lib/api-client';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<OrderStatusHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [orderRes, historyRes] = await Promise.all([
          fetchApi<{ isSuccess: boolean; value: OrderDto }>('oms', `/orders/${id}`),
          fetchApi<{ isSuccess: boolean; value: OrderStatusHistoryDto[] }>('oms', `/orders/${id}/status-history`)
        ]);

        if (orderRes.isSuccess && orderRes.value) {
          setOrder(orderRes.value);
        }
        if (historyRes.isSuccess && historyRes.value) {
          setTimelineEvents(historyRes.value);
        }
      } catch (error) {
        console.error('Failed to load order details', error);
        toast.error('Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-bold mb-2">Không tìm thấy đơn hàng</h2>
        <p className="text-muted-foreground mb-6">Đơn hàng bạn yêu cầu không tồn tại hoặc bạn không có quyền xem.</p>
        <Button asChild>
          <Link href="/portal/orders">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const canCancel = order.status === 'New' || order.status === 'AwaitingPickup';

  async function handleCancel() {
    setCancelOpen(false);
    try {
      const res = await fetchApi<{isSuccess: boolean}>('oms', `/orders/${id}/cancel`, { method: 'POST' });
      if (res.isSuccess) {
        toast.success('Đơn hàng đã được hủy thành công');
        // Reload page to get new status
        window.location.reload();
      } else {
        toast.error('Không thể hủy đơn hàng');
      }
    } catch (error) {
      toast.error('Lỗi khi hủy đơn hàng');
    }
  }

  // Fallback info for demo purposes since sender/receiver info might not be fully modeled in basic DTO
  const senderInfo = {
    name: 'Khách hàng',
    phone: 'Đang cập nhật',
    address: 'Đang cập nhật',
  };

  const receiverInfo = {
    name: order.consigneeName || 'Người nhận',
    phone: 'Đang cập nhật',
    address: order.consigneeCity || 'Đang cập nhật',
  };

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" className="w-fit gap-1.5" asChild>
          <Link href="/portal/orders">
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{order.orderNo || order.waybillCode}</h1>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Tạo lúc {format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy')}
          </span>
          <div className="flex-1" />
          <ShippingLabelDialog order={order} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left - Order Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sender */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <User className="size-4 text-blue-600" />
                </div>
                Người gửi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={User} label="Họ tên" value={senderInfo.name} />
              <InfoRow icon={Phone} label="Số điện thoại" value={senderInfo.phone} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={senderInfo.address} />
            </CardContent>
          </Card>

          {/* Receiver */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <MapPin className="size-4 text-emerald-600" />
                </div>
                Người nhận
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow icon={User} label="Họ tên" value={receiverInfo.name} />
              <InfoRow icon={Phone} label="Số điện thoại" value={receiverInfo.phone} />
              <InfoRow icon={MapPin} label="Địa chỉ" value={receiverInfo.address} />
            </CardContent>
          </Card>

          {/* Package info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className="size-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Package className="size-4 text-violet-600" />
                </div>
                Thông tin kiện hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow icon={Weight} label="Trọng lượng" value={`${order.totalWeight} kg`} />
                <InfoRow icon={Banknote} label="Tiền thu hộ (COD)" value={formatCurrency(order.codAmount)} />
                <InfoRow icon={Banknote} label="Phí vận chuyển" value={formatCurrency(order.shippingFee)} />
                {order.notes && <InfoRow icon={FileText} label="Ghi chú" value={order.notes} />}
              </div>
              {order.items && order.items.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Sản phẩm</p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.skuCode}</span>
                          <span className="text-muted-foreground">
                            x{item.quantity} · {formatCurrency(item.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Lịch sử trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineEvents.length > 0 ? (
                <OrderTimeline events={timelineEvents} currentStatus={order.status} />
              ) : (
                <div className="text-sm text-muted-foreground">Chưa có thông tin lịch sử.</div>
              )}
            </CardContent>
          </Card>

          {/* Cancel button area */}
          {canCancel && (
            <Card className="shadow-sm border-destructive/30">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Bạn có thể hủy đơn hàng khi trạng thái còn ở &quot;Mới&quot; hoặc &quot;Chờ lấy hàng&quot;.
                </p>
                <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Hủy đơn hàng
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
                      <DialogDescription>
                        Bạn có chắc chắn muốn hủy đơn hàng <strong>{order.orderNo}</strong>? Hành động này không thể hoàn tác.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Không, giữ lại</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={handleCancel}>
                        Có, hủy đơn
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
