# LMS Web (Next.js)

Giao diện **phong cách Odoo** (sidebar tím, Apps, bảng/card) cho **OMS/WMS**.

## Stack

- Next.js **16** (App Router), React **19**, TypeScript  
- Tailwind CSS **4**  
- **TanStack Query**, **lucide-react**

## Chạy

```bash
cd frontend
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_GATEWAY = BFF — mặc định 127.0.0.1:5200 ; full Docker gateway thường :8000
npm run dev
```

**Trước khi nhấn tạo đơn**, chạy BFF + OMS (+ WMS nếu cần): xem cổng trong `AGENTS.md` (`Web.Bff.Logistics.Api` trên **5200**).

Mở [http://localhost:3000](http://localhost:3000).

1. **Cài đặt** → dán Bearer token Keycloak (`access_token`).
2. **Đơn hàng** → tạo đơn / tra cứu (gọi BFF `/api/ordering/api/Orders` hoặc tương đương).

**Đường gọi API:** có `NEXT_PUBLIC_API_GATEWAY` thì browser gọi thẳng BFF (CORS đã mở ở gateway), terminal Next không proxy nên không còn cụm `Failed to proxy... ECONNREFUSED` khi gateway tắt — lỗi chỉ hiện ở UI.

Nếu **không** set `NEXT_PUBLIC_API_GATEWAY`, vẫn dùng rewrite same-origin trong `next.config.ts`:

- OMS: `/bff/oms/*` → `{API_GATEWAY_TARGET}/api/ordering/*`
- WMS: `/bff/wms/*` → `{API_GATEWAY_TARGET}/api/warehouse/*`

Backend BFF và cổng: xem `AGENTS.md` của repo.

## Việc chưa làm

- Đăng nhập OAuth đầy đủ với Keycloak (redirect flow).
- Form inbound/outbound đầy đủ — hiện ưu tiên shell Odoo + OMS demo.
