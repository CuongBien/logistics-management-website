'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

import type { OrderDto, OrderStatusHistoryDto } from '@/types/oms';
import { StatusBadge } from '@/components/portal/status-badge';
import { OrderTimeline } from '@/components/portal/order-timeline';
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

// ──────────────────────────────────────────────
// Dummy Data
// ──────────────────────────────────────────────

const order: OrderDto = {
  id: '1',
  orderNo: 'SH240601001',
  status: 'Delivering',
  tenantId: 'T001',
  consignorId: 'C001',
  consigneeName: 'Trần Thị B',
  consigneeCity: 'Hồ Chí Minh',
  totalWeight: 2.5,
  codAmount: 350000,
  shippingFee: 27500,
  notes: 'Giao giờ hành chính, gọi trước khi giao',
  createdAt: '2024-06-01T10:30:00Z',
  items: [
    { id: 'i1', skuCode: 'SKU-001', quantity: 2, price: 120000 },
    { id: 'i2', skuCode: 'SKU-002', quantity: 1, price: 110000 },
  ],
};

const senderInfo = {
  name: 'Nguyễn Văn A',
  phone: '0901234567',
  address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
};

const receiverInfo = {
  name: order.consigneeName,
  phone: '0987654321',
  address: '456 Trần Phú, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng',
};

const timelineEvents: OrderStatusHistoryDto[] = [
  { status: 'New', changedAt: '2024-06-01T08:00:00Z', changedBy: 'Hệ thống' },
  { status: 'Confirmed', changedAt: '2024-06-01T08:05:00Z', changedBy: 'Hệ thống' },
  { status: 'AwaitingPickup', changedAt: '2024-06-01T09:00:00Z', changedBy: 'Hệ thống' },
  { status: 'PickedUp', changedAt: '2024-06-01T14:30:00Z', changedBy: 'Nguyễn Văn Shipper', reason: 'Đã lấy hàng tại 123 Nguyễn Huệ, Q1' },
  { status: 'Delivering', changedAt: '2024-06-02T09:15:00Z', changedBy: 'Trần Văn Giao', reason: 'Đang giao đến người nhận' },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

// ──────────────────────────────────────────────
// Info Row helper
// ──────────────────────────────────────────────

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
  const [cancelOpen, setCancelOpen] = useState(false);

  const canCancel = order.status === 'New' || order.status === 'AwaitingPickup';

  function handleCancel() {
    setCancelOpen(false);
    toast.success('Đơn hàng đã được hủy thành công');
  }

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
            <h1 className="text-2xl font-bold tracking-tight">{order.orderNo}</h1>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-sm text-muted-foreground">
            Tạo lúc {format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy')}
          </span>
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
              <OrderTimeline events={timelineEvents} currentStatus={order.status} />
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
