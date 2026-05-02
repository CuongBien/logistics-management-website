import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type AppShellProps = {
  children: ReactNode;
  title: string;
  breadcrumb?: string;
};

export function AppShell({ children, title, breadcrumb }: AppShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-1 bg-odoo-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} breadcrumb={breadcrumb} />
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
