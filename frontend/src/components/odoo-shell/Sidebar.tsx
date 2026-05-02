"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Package,
  Warehouse,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

const mainNav = [
  { href: "/", label: "Ứng dụng", icon: LayoutGrid },
  { href: "/ordering", label: "Đơn hàng (OMS)", icon: Package },
  { href: "/warehouse", label: "Kho (WMS)", icon: Warehouse },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-odoo-sidebar-dim bg-odoo-sidebar text-[13px] text-white shadow-[inset_-1px_0_0_rgba(0,0,0,0.08)]">
      <div className="flex h-12 items-center gap-2 border-b border-black/15 px-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10 text-xs font-bold tracking-tight">
          L
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate font-semibold">LMS</div>
          <div className="truncate text-[11px] text-white/65">
            Logistics
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 py-2">
        {mainNav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "mx-1 flex items-center gap-2 rounded px-2 py-1.5 transition-colors",
                active
                  ? "bg-black/25 text-white shadow-[inset_3px_0_0_#7cd0c1]"
                  : "text-white/85 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0 opacity-90" strokeWidth={1.75} />
              <span className="truncate">{label}</span>
              {active && (
                <ChevronRight className="ml-auto size-3.5 shrink-0 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/15 p-2 text-[11px] text-white/50">
        Giao diện theo phong cách Odoo (sidebar & bảng).
      </div>
    </aside>
  );
}
