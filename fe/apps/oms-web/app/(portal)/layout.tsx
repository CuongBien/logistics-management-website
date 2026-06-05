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
