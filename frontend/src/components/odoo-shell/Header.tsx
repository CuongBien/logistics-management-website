"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";

type HeaderProps = {
  title: string;
  breadcrumb?: string;
};

export function Header({ title, breadcrumb }: HeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-odoo-border bg-white px-4 text-[13px] text-odoo-text">
      <div className="min-w-0 flex-1">
        {breadcrumb && (
          <div className="mb-0.5 text-[11px] text-odoo-muted">
            {breadcrumb}
          </div>
        )}
        <h1 className="truncate text-base font-semibold text-odoo-text">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded p-2 text-odoo-muted hover:bg-odoo-canvas hover:text-odoo-text"
          aria-label="Tìm kiếm"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          className="rounded p-2 text-odoo-muted hover:bg-odoo-canvas hover:text-odoo-text"
          aria-label="Thông báo"
        >
          <Bell className="size-4" />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded border border-odoo-border bg-odoo-canvas px-2 py-1">
          <UserCircle2 className="size-5 text-odoo-muted" />
          <span className="hidden text-odoo-muted sm:inline">Phiên</span>
        </div>
      </div>
    </header>
  );
}
