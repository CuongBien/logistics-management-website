import { Navbar } from "@/components/dashboard/navbar"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { WarehouseProvider } from "@/components/wms/rbac/WarehouseContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WarehouseProvider>
      <div className="min-h-screen bg-background flex">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <footer className="bg-muted border-t border-border px-4 py-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>System Status: <span className="text-green-600 font-medium">Online</span></span>
              <span>OMS: localhost:5000</span>
              <span>WMS: localhost:5051</span>
            </div>
            <div>
              <span>BEST Inc Internal Operations v2.4.1</span>
            </div>
          </footer>
        </div>
      </div>
    </WarehouseProvider>
  )
}
