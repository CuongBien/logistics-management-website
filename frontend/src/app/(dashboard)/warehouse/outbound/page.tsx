export default function WarehouseOutboundPage() {
  return (
    <div className="odoo-card max-w-2xl p-5 text-[13px] leading-relaxed text-odoo-text">
      <h2 className="mb-2 text-[15px] font-semibold">Outbound (Draft)</h2>
      <p className="text-odoo-muted">
        Phiếu <strong>OutboundOrder</strong> lưu kế hoạch SKU/qty và kho đích;
        hiện <strong>chưa khóa</strong> chặng sort — dùng API{" "}
        <code className="rounded bg-odoo-canvas px-1">POST /api/outbound/orders</code>{" "}
        (Postman STEP 2c) khi build thêm UI form tại đây.
      </p>
      <ul className="mt-3 list-inside list-disc text-[12px] text-odoo-muted">
        <li>Đích BFF: /bff/wms/api/outbound/orders</li>
        <li>JWT: Cài đặt → Bearer token</li>
      </ul>
    </div>
  );
}
