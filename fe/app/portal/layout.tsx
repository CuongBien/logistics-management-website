'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalTopbar } from '@/components/portal/portal-topbar';
import { Loader2 } from 'lucide-react';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isAuthPage = pathname === '/portal/login' || pathname === '/portal/register';

  useEffect(() => {
    // Check local storage for auth state
    const authSession = localStorage.getItem('shiphub_auth');
    const currentPhone = localStorage.getItem('shiphub_current_phone') || '0901234567';
    
    // Initialize default profile if not exists
    if (!localStorage.getItem('shiphub_profile')) {
      localStorage.setItem(
        'shiphub_profile',
        JSON.stringify({
          fullName: 'Nguyễn Văn A',
          phone: '0901234567',
          shopName: 'ShipHub Shop',
          shopCategory: 'fashion',
          address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        })
      );
    }

    // Prepopulate default orders for demo user (0901234567) if not present
    const demoOrdersKey = 'shiphub_orders_0901234567';
    if (!localStorage.getItem(demoOrdersKey)) {
      const demoOrders = [
        { id: '1', orderNo: 'SH240601001', status: 'Delivering', consigneeName: 'Trần Thị B', consigneeCity: 'Hồ Chí Minh', totalWeight: 2.5, codAmount: 350000, createdAt: '2024-06-01T10:30:00Z' },
        { id: '2', orderNo: 'SH240601002', status: 'Delivered', consigneeName: 'Lê Văn C', consigneeCity: 'Hà Nội', totalWeight: 1.2, codAmount: 0, createdAt: '2024-06-01T09:15:00Z' },
        { id: '3', orderNo: 'SH240531005', status: 'AwaitingPickup', consigneeName: 'Phạm Thị D', consigneeCity: 'Đà Nẵng', totalWeight: 3.8, codAmount: 520000, createdAt: '2024-05-31T14:20:00Z' },
        { id: '4', orderNo: 'SH240531003', status: 'New', consigneeName: 'Hoàng Minh E', consigneeCity: 'Cần Thơ', totalWeight: 0.8, codAmount: 180000, createdAt: '2024-05-31T11:45:00Z' },
        { id: '5', orderNo: 'SH240530012', status: 'Completed', consigneeName: 'Ngô Thanh F', consigneeCity: 'Hải Phòng', totalWeight: 5.0, codAmount: 890000, createdAt: '2024-05-30T08:00:00Z' },
        { id: '6', orderNo: 'SH240529008', status: 'Cancelled', consigneeName: 'Vũ Minh G', consigneeCity: 'Hồ Chí Minh', totalWeight: 1.5, codAmount: 250000, createdAt: '2024-05-29T16:00:00Z' },
        { id: '7', orderNo: 'SH240528015', status: 'InWarehouse', consigneeName: 'Đặng Thị H', consigneeCity: 'Hà Nội', totalWeight: 4.2, codAmount: 720000, createdAt: '2024-05-28T10:30:00Z' },
        { id: '8', orderNo: 'SH240527002', status: 'Confirmed', consigneeName: 'Bùi Văn I', consigneeCity: 'Đà Nẵng', totalWeight: 2.0, codAmount: 0, createdAt: '2024-05-27T08:45:00Z' },
        { id: '9', orderNo: 'SH240526011', status: 'Failed', consigneeName: 'Lý Thị K', consigneeCity: 'Cần Thơ', totalWeight: 3.1, codAmount: 430000, createdAt: '2024-05-26T13:20:00Z' },
        { id: '10', orderNo: 'SH240525006', status: 'PickedUp', consigneeName: 'Nguyễn Văn L', consigneeCity: 'Hải Phòng', totalWeight: 1.8, codAmount: 150000, createdAt: '2024-05-25T07:30:00Z' },
      ];
      localStorage.setItem(demoOrdersKey, JSON.stringify(demoOrders));
    }

    // Initialize custom user orders to empty list if not present
    const customOrdersKey = `shiphub_orders_${currentPhone}`;
    if (!localStorage.getItem(customOrdersKey)) {
      localStorage.setItem(customOrdersKey, JSON.stringify([]));
    }

    if (authSession === 'true') {
      setIsAuthenticated(true);
      if (isAuthPage) {
        router.push('/portal/dashboard');
      } else {
        setLoading(false);
      }
    } else {
      setIsAuthenticated(false);
      if (!isAuthPage) {
        router.push('/portal/login');
      } else {
        setLoading(false);
      }
    }
  }, [pathname, isAuthPage, router]);

  // If loading, show elegant skeleton/spinner
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-blue-600" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Đang xác thực thông tin...
          </p>
        </div>
      </div>
    );
  }

  // If it's an Auth page, bypass the sidebar layout wrapper entirely
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <PortalSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PortalTopbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
