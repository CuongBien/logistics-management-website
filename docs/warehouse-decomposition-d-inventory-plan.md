# Kế Hoạch Phân Rã D - Inventory (Items/Reservations/Ledger)

## Bối cảnh
Giả định:
- `W-Overview` đã qua gate.
- Phân rã A (Layout), B (Inbound), C (Outbound) đã hoàn tất hoặc đủ ổn định.

Phân rã D tập trung chuẩn hóa tồn kho theo 3 lớp:
- `InventoryItems` (snapshot hiện tại)
- `InventoryReservations` (chi tiết giữ hàng cho outbound)
- `InventoryLedger` (nhật ký biến động append-only)

---

## Mục tiêu chính
1. Tách rõ snapshot tồn (`InventoryItems`) và lịch sử biến động (`InventoryLedger`).
2. Đảm bảo quy tắc reserve/release/consume đúng, không âm kho.
3. Chống double-reserve trong luồng outbound cạnh tranh.
4. Truy vết được nguyên nhân thay đổi tồn bằng `reference_type/reference_id/correlation_id`.

---

## Phạm vi (in-scope)

### Bảng và quan hệ
- `InventoryItems`
- `InventoryReservations`
- `InventoryLedger`
- Quan hệ: `InventoryItems` 1-n `InventoryReservations`

Out-of-scope:
- Costing chi tiết (FIFO valuation, weighted average accounting).
- Điều phối tối ưu multi-bin nâng cao.

---

## Thiết kế chuẩn hóa đề xuất

## 1) `InventoryItems` (snapshot)
Trường chính:
- `id`, `sku_code`, `warehouse_id`, `bin_id`, `qty_on_hand`, `qty_reserved`, `version`, `last_restocked_at`

Ràng buộc bắt buộc:
- `sku_code` not null
- `warehouse_id` FK, not null
- `bin_id` FK, not null
- `qty_on_hand >= 0`
- `qty_reserved >= 0`
- `qty_reserved <= qty_on_hand`
- `version >= 1`

Unique khuyến nghị:
- `(sku_code, warehouse_id, bin_id)` unique

## 2) `InventoryReservations`
Trường chính:
- `id`, `outbound_line_id`, `inventory_item_id`, `reserved_qty`, `status`, `expires_at`

Ràng buộc bắt buộc:
- `outbound_line_id` FK, not null
- `inventory_item_id` FK, not null
- `reserved_qty > 0`
- `status` thuộc enum hợp lệ

Enum gợi ý:
- `Active`, `Released`, `Consumed`, `Expired`, `Cancelled`

Quy tắc nghiệp vụ:
- Tổng reservation active trên một `inventory_item_id` không vượt `qty_on_hand`.
- Reservation hết hạn phải được release đúng và nhất quán.

## 3) `InventoryLedger` (append-only)
Trường chính:
- `id`, `sku_code`, `warehouse_id`, `bin_id`, `delta_qty`, `reason`, `reference_type`, `reference_id`, `correlation_id`, `occurred_at`

Ràng buộc bắt buộc:
- `sku_code` not null
- `warehouse_id` FK, not null
- `bin_id` FK, not null
- `delta_qty != 0` (khuyến nghị)
- `reason` thuộc enum/code chuẩn
- `occurred_at` not null

Nguyên tắc:
- Append-only (không update/xóa bản ghi lịch sử).
- Nếu cần sửa sai, ghi bút toán bù (delta ngược dấu), không sửa dòng cũ.

Reason gợi ý:
- `InboundReceived`, `Reserve`, `Release`, `Pick`, `Pack`, `Ship`, `Return`, `AdjustIncrease`, `AdjustDecrease`

---

## Kế hoạch thực thi

## Bước 1 - Chốt mô hình nhất quán tồn
- Chốt cách cập nhật snapshot:
  - Đồng bộ tức thời cùng transaction với reservation/ledger.
- Chốt policy khi reserve:
  - reserve từ 1 bin hay cho phép split nhiều bin (gắn với outbound step).

Đầu ra:
- Quy tắc tính tồn khả dụng được chốt rõ (`available = qty_on_hand - qty_reserved`).

## Bước 2 - Migration schema + index
Index bắt buộc:
- `InventoryItems(warehouse_id, sku_code, bin_id)`
- `InventoryItems(warehouse_id, bin_id)`
- `InventoryReservations(inventory_item_id, status, expires_at)`
- `InventoryReservations(outbound_line_id, status)`
- `InventoryLedger(sku_code, warehouse_id, occurred_at desc)`
- `InventoryLedger(correlation_id)`

Đầu ra:
- DB sẵn sàng cho reserve/release/ship với truy vấn ổn định.

## Bước 3 - Viết luồng nghiệp vụ reserve/release/consume
- Reserve:
  - tạo `InventoryReservations`
  - tăng `qty_reserved` ở `InventoryItems`
  - ghi ledger reason=`Reserve` (nếu bật recording đầy đủ)
- Release/Expire:
  - cập nhật reservation status
  - giảm `qty_reserved`
  - ghi ledger reason=`Release`/`Expired`
- Consume (ship):
  - cập nhật reservation `Consumed`
  - giảm `qty_on_hand`
  - giảm `qty_reserved`
  - ghi ledger reason=`Ship`

Đầu ra:
- Tồn kho và reservation luôn đồng bộ sau mỗi hành động.

## Bước 4 - Concurrency + idempotency
- Dùng `version` để optimistic concurrency trên `InventoryItems`.
- Bảo vệ duplicate command/event:
  - idempotency key theo `reference_type + reference_id + reason` (hoặc message id).

Đầu ra:
- Không double-reserve hoặc double-consume khi retry/replay.

## Bước 5 - Đối soát và kiểm thử
- Đối soát snapshot vs ledger theo sample window.
- Chạy E2E outbound/inbound sau khi bật inventory normalization.

Đầu ra:
- Inventory decomposition ổn định, có khả năng trace nguyên nhân lệch.

---

## Test plan

### Unit tests
- Reserve vượt tồn khả dụng -> fail.
- Release reservation đúng cập nhật `qty_reserved`.
- Ship không có reservation active -> fail.
- `qty_reserved > qty_on_hand` bị chặn.

### Integration tests
- Chuỗi reserve -> pick -> pack -> ship cập nhật đúng cả 3 bảng.
- Expire reservation chạy đúng và không gây âm kho.
- Replay cùng event không tạo duplicate side effects.

### Data verification
- Invariant luôn đúng sau mọi transaction:
  - `qty_on_hand >= 0`
  - `qty_reserved >= 0`
  - `qty_reserved <= qty_on_hand`

---

## Exit criteria của phân rã D (Inventory)
- [ ] `InventoryItems` + `InventoryReservations` + `InventoryLedger` vận hành nhất quán.
- [ ] Không âm kho trong các flow kiểm thử chuẩn.
- [ ] Replay/idempotency pass.
- [ ] Có thể truy vết biến động chính bằng ledger.
- [ ] E2E liên kho vẫn xanh sau khi bật inventory normalization.

---

## Rủi ro và giảm thiểu

1. Rủi ro race condition khi nhiều request reserve cùng SKU/bin.
   - Giảm thiểu: transaction + optimistic concurrency + retry có kiểm soát.

2. Rủi ro lệch snapshot/ledger.
   - Giảm thiểu: ghi snapshot + ledger trong cùng transaction boundary.

3. Rủi ro policy expire reservation không nhất quán.
   - Giảm thiểu: job expire định kỳ + test rõ chuyển trạng thái.

---

## Câu hỏi mở cần bạn chốt
1. Bạn muốn bật `InventoryLedger` đầy đủ ngay trong phân rã D, hay rollout 2 bước (D1 snapshot+reservation, D2 ledger)?
2. Reservation hết hạn có auto-release bằng job nền không, hay release theo request nghiệp vụ?
3. Cho phép split reservation nhiều bin cho cùng outbound line ngay bây giờ không?
4. `delta_qty = 0` có cho phép ghi ledger như marker event không, hay chặn hoàn toàn?

