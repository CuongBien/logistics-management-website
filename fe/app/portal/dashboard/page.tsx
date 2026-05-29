'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Package,
  Truck,
  Wallet,
  TrendingUp,
  Eye,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import type { OrderSummaryDto } from '@/types/oms';
import { StatCard } from '@/components/portal/stat-card';
import { StatusBadge } from '@/components/portal/status-badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 font-medium text-sm">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
        <span className="text-muted-foreground">{name}:</span>
        <span className="font-medium">{value}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {payload?.map((entry: { value: string; color: string }, idx: number) => (
        <div key={idx} className="flex items-center gap-1.5 text-sm">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderSummaryDto[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    delivering: 0,
    cod: 0,
    fee: 0,
  });
  const [pieData, setPieData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const currentPhone = localStorage.getItem('shiphub_current_phone') || '0901234567';
    const ordersKey = `shiphub_orders_${currentPhone}`;
    const saved = localStorage.getItem(ordersKey);
    const list: OrderSummaryDto[] = saved ? JSON.parse(saved) : [];
    setOrders(list);

    // Calculate stats
    const total = list.length;
    const delivering = list.filter((o) => o.status === 'Delivering').length;
    
    // COD is pending for active delivery/order statuses
    const pendingStatuses = ['New', 'Confirmed', 'AwaitingPickup', 'PickedUp', 'AwaitingInbound', 'InWarehouse', 'Sorting', 'AwaitingDispatch', 'Dispatched', 'Delivering', 'Delivered'];
    const cod = list
      .filter((o) => pendingStatuses.includes(o.status))
      .reduce((sum, o) => sum + (o.codAmount || 0), 0);

    // Calculate simulated fee
    const fee = list.reduce((sum, o) => sum + ((o.totalWeight || 0) * 5000 + 15000), 0);

    setStats({ total, delivering, cod, fee });

    // Pie chart distribution
    const deliveredCount = list.filter((o) => o.status === 'Delivered' || o.status === 'Completed').length;
    const deliveringCount = list.filter((o) => o.status === 'Delivering').length;
    const cancelledCount = list.filter((o) => o.status === 'Cancelled').length;
    const otherCount = total - deliveredCount - deliveringCount - cancelledCount;

    setPieData([
      { name: 'Đã giao', value: deliveredCount, color: '#10b981' },
      { name: 'Đang giao', value: deliveringCount, color: '#3b82f6' },
      { name: 'Đã hủy', value: cancelledCount, color: '#f43f5e' },
      { name: 'Khác', value: Math.max(0, otherCount), color: '#9ca3af' },
    ]);

    // Monthly chart data
    if (total === 0) {
      setMonthlyData([
        { month: 'Th01', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th02', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th03', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th04', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th05', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th06', delivered: 0, cancelled: 0, inTransit: 0 },
      ]);
    } else if (currentPhone === '0901234567') {
      // Demo mock data distribution
      setMonthlyData([
        { month: 'Th01', delivered: 145, cancelled: 8, inTransit: 12 },
        { month: 'Th02', delivered: 168, cancelled: 5, inTransit: 15 },
        { month: 'Th03', delivered: 192, cancelled: 12, inTransit: 18 },
        { month: 'Th04', delivered: 178, cancelled: 7, inTransit: 22 },
        { month: 'Th05', delivered: 210, cancelled: 6, inTransit: 14 },
        { month: 'Th06', delivered: deliveredCount, cancelled: cancelledCount, inTransit: deliveringCount },
      ]);
    } else {
      setMonthlyData([
        { month: 'Th01', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th02', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th03', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th04', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th05', delivered: 0, cancelled: 0, inTransit: 0 },
        { month: 'Th06', delivered: deliveredCount, cancelled: cancelledCount, inTransit: deliveringCount },
      ]);
    }
  }, []);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Tổng quan hoạt động gửi hàng của bạn</p>
      </div>

      {/* Row 1 – Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng đơn hàng"
          value={stats.total.toLocaleString()}
          icon={Package}
          trend={stats.total > 0 ? { value: 12.5, isPositive: true } : undefined}
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Đang vận chuyển"
          value={stats.delivering.toLocaleString()}
          subtitle="đơn đang trên đường"
          icon={Truck}
          gradient="from-orange-500 to-amber-500"
        />
        <StatCard
          title="COD chờ đối soát"
          value={formatCurrency(stats.cod)}
          icon={Wallet}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          title="Phí vận chuyển tháng này"
          value={formatCurrency(stats.fee)}
          icon={TrendingUp}
          trend={stats.total > 0 ? { value: 5.2, isPositive: false } : undefined}
          gradient="from-violet-500 to-purple-600"
        />
      </div>

      {/* Row 2 – Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Bar chart */}
        <Card className="lg:col-span-4 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Thống kê đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="delivered" name="Đã giao" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cancelled" name="Đã hủy" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inTransit" name="Đang giao" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card className="lg:col-span-3 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">Phân bố trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              {stats.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="var(--color-background)"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend content={renderCustomLegend} />
                    {/* Center label */}
                    <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                      {stats.total.toLocaleString()}
                    </text>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                      Tổng đơn
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Package className="size-12 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Chưa có dữ liệu phân bố</p>
                  <p className="text-xs text-muted-foreground/70">Hãy tạo đơn hàng để bắt đầu thống kê</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3 – Recent Orders */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Đơn hàng gần đây</CardTitle>
          {orders.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/orders" className="gap-1 text-sm text-muted-foreground hover:text-foreground">
                Xem tất cả <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead className="hidden md:table-cell">Thành phố</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden sm:table-cell">Ngày tạo</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.orderNo}</TableCell>
                    <TableCell>{order.consigneeName}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{order.consigneeCity}</TableCell>
                    <TableCell className="text-right">{order.codAmount > 0 ? formatCurrency(order.codAmount) : '—'}</TableCell>
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="size-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-base font-semibold">Chưa có đơn hàng nào</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Tài khoản mới của bạn chưa có bất kỳ hoạt động gửi hàng nào. Hãy lên đơn hàng đầu tiên ngay!
              </p>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 gap-1.5 shadow-sm">
                <Link href="/portal/orders/create">
                  <PlusCircle className="size-4" /> Tạo đơn hàng ngay
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
