'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PortalSidebar } from '@/components/portal/portal-sidebar';
import { PortalTopbar } from '@/components/portal/portal-topbar';
import { Loader2 } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { AuthProvider } from '@/components/auth-provider';

function PortalContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAuthPage = pathname === '/portal/login' || pathname === '/portal/register';

  // If loading, show elegant skeleton/spinner
  if (status === "loading") {
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

  if (status === "unauthenticated" && !isAuthPage) {
    signIn("keycloak");
    return null;
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

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PortalContent>{children}</PortalContent>
    </AuthProvider>
  );
}
