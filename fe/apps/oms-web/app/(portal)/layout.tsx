'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalTopbar } from '@/components/portal/portal-topbar';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AuthProvider } from '@/components/auth-provider';

// Pages that do NOT require authentication
const AUTH_PAGES = ['/login', '/register'];

function PortalContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthPage = AUTH_PAGES.includes(pathname);

  // 1. Decode Keycloak access token to check if WMS staff
  let isWmsStaff = false;
  if (status === 'authenticated' && session?.accessToken) {
    try {
      const base64Url = session.accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      const realmRoles = decoded.realm_access?.roles || [];
      const resourceRoles = decoded.resource_access?.['wms-client']?.roles || [];
      
      isWmsStaff =
        realmRoles.some((r: string) => r.startsWith('WMS_') || r === 'admin') ||
        resourceRoles.some((r: string) => r.startsWith('WMS_')) ||
        decoded.preferred_username === 'admin' ||
        decoded.preferred_username?.startsWith('wms_') ||
        decoded.email?.startsWith('admin@') ||
        decoded.email?.startsWith('wms_');
    } catch (e) {
      console.error('Failed to decode token in OMS PortalContent', e);
    }
  }

  // FIX: Never call router.replace() during render — use useEffect to avoid React setState-in-render error
  useEffect(() => {
    if (status === 'unauthenticated' && !isAuthPage) {
      router.replace('/login');
    }
  }, [status, isAuthPage, router]);

  // Show spinner while session is loading
  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-indigo-600" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">
            Đang xác thực thông tin...
          </p>
        </div>
      </div>
    );
  }

  // Block WMS staff from entering OMS
  if (status === 'authenticated' && isWmsStaff && !isAuthPage) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white px-6">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center border-2 border-red-500/20">
              <span className="text-3xl">🚫</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-red-500 uppercase tracking-wide">Truy Cập Bị Từ Chối</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tài khoản <strong className="text-white">{session?.user?.name || 'nhân sự'}</strong> là nhân viên vận hành kho (WMS).
            <br/>
            Bạn không có quyền truy cập vào <strong>Cổng Khách Hàng (OMS)</strong>.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <a 
              href="http://localhost:3000" 
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 text-center"
            >
              Đi tới Cổng Vận Hành (WMS)
            </a>
            <button 
              onClick={() => {
                import('next-auth/react').then(m => m.signOut({ callbackUrl: '/login' }));
              }}
              className="w-full py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-700/50 text-sm font-semibold transition-colors"
            >
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auth pages (login/register): render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Not yet authenticated: show nothing (useEffect above will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Authenticated: show full layout with sidebar + topbar
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

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalContent>{children}</PortalContent>
    </AuthProvider>
  );
}
