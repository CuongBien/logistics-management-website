"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/odoo-shell/AppShell";

const META: Record<string, { title: string; breadcrumb: string }> = {
  "/": { title: "Ứng dụng", breadcrumb: "LMS / Trang chủ" },
  "/ordering": { title: "Đơn hàng", breadcrumb: "LMS / Đơn hàng (OMS)" },
  "/warehouse": { title: "Kho", breadcrumb: "LMS / Kho (WMS)" },
  "/warehouse/outbound": {
    title: "Xuất kho (Outbound)",
    breadcrumb: "LMS / Kho / Outbound",
  },
  "/settings": { title: "Cài đặt", breadcrumb: "LMS / Cài đặt" },
};

function resolveMeta(pathname: string) {
  if (META[pathname]) return META[pathname];
  for (const key of Object.keys(META).sort((a, b) => b.length - a.length)) {
    if (pathname.startsWith(key) && key !== "/") return META[key]!;
  }
  return META["/"]!;
}

export function OdooLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { title, breadcrumb } = resolveMeta(pathname);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppShell title={title} breadcrumb={breadcrumb}>
        {children}
      </AppShell>
    </div>
  );
}
