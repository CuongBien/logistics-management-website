import Link from "next/link";
import { ArrowRight, PackageOpen, Split } from "lucide-react";

export default function WarehousePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-[13px] text-odoo-muted">
        WMS gọi qua BFF rewrite <code className="rounded bg-white px-1">/bff/wms/…</code>.
        Cần token + quyền kho giống Postman.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/warehouse/outbound"
          className="odoo-card flex items-center gap-3 p-4 hover:shadow-md"
        >
          <div className="flex size-11 items-center justify-center rounded bg-odoo-sidebar/10 text-odoo-sidebar">
            <Split className="size-5" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">Outbound nháp</div>
            <div className="text-[12px] text-odoo-muted">
              Phiếu Draft + API mới
            </div>
          </div>
          <ArrowRight className="size-4 text-odoo-muted" />
        </Link>

        <div className="odoo-card flex cursor-not-allowed items-center gap-3 p-4 opacity-70">
          <div className="flex size-11 items-center justify-center rounded bg-odoo-canvas text-odoo-muted">
            <PackageOpen className="size-5" />
          </div>
          <div>
            <div className="text-[14px] font-semibold">Nhập kho</div>
            <div className="text-[12px] text-odoo-muted">
              Dùng Postman / làm màn hình sau
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
