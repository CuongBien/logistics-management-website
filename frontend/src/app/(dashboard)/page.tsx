import Link from "next/link";
import { Package, Warehouse, Settings } from "lucide-react";

const apps = [
  {
    href: "/ordering",
    title: "Đơn hàng",
    subtitle: "OMS — tạo & tra cứu đơn",
    icon: Package,
  },
  {
    href: "/warehouse",
    title: "Kho",
    subtitle: "WMS — nhập / xuất",
    icon: Warehouse,
  },
  {
    href: "/settings",
    title: "Cài đặt",
    subtitle: "Token & môi trường",
    icon: Settings,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      <p className="mb-4 text-[13px] text-odoo-muted">
        Chọn ứng dụng — bố cục kiểu <strong>Odoo Apps</strong>.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map(({ href, title, subtitle, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="odoo-card flex gap-3 p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded bg-odoo-sidebar/10 text-odoo-sidebar">
              <Icon className="size-6" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-odoo-text">
                {title}
              </div>
              <div className="mt-0.5 text-[12px] text-odoo-muted">
                {subtitle}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
