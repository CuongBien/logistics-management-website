# Hướng Dẫn Kiểm Tra & Đối Soát Sổ Cái Tồn Kho (Inventory Ledger)

Hệ thống Sổ cái (Ledger) vừa được triển khai là lớp bảo vệ dữ liệu cao nhất cho kho hàng. Tài liệu này hướng dẫn bạn cách kiểm tra xem dữ liệu có được ghi nhận đúng và đủ hay không.

## 1. Cơ chế hoạt động (The Logic)
Mọi thay đổi trong bảng `InventoryItems` (Snapshot) bây giờ đều phải có một bản ghi tương ứng trong bảng `InventoryLedgers` (Audit Trail).

| Hành động | Transaction Type | Quantity Change | Biến động vật lý |
| :--- | :--- | :--- | :--- |
| Nhập kho (Receive) | `Inbound` | `+N` | Có (Tăng tồn kho) |
| Giữ hàng (Reserve) | `Reservation` | `0` | Không (Chỉ thay đổi logic Reservation) |
| Hủy giữ (Release) | `Release` | `0` | Không |
| Hết hạn giữ (Expire)| `Expired` | `0` | Không |
| Xuất kho (Consume) | `Outbound` | `-N` | Có (Giảm tồn kho) |

---

## 2. Hướng dẫn Test luồng E2E

### Bước 1: Nhập hàng (Inbound)
1.  Gửi request `Receive Inbound Item` trong Postman.
2.  Kiểm tra Ledger qua API `Get Inventory Ledger`.
    *   **Kỳ vọng**: Xuất hiện 1 dòng `Inbound` với `QuantityChange = +5` (ví dụ) và `BalanceAfter = 5`.

### Bước 2: Giữ hàng (Reserve)
1.  Gửi request `Reserve Stock`.
2.  Kiểm tra Ledger.
    *   **Kỳ vọng**: Xuất hiện 1 dòng `Reservation` với `QuantityChange = 0` và `BalanceAfter = 5`. 
    *   *Lưu ý*: Lệnh giữ hàng không làm giảm số lượng thực tế trong kho nên `QuantityChange = 0`.

### Bước 3: Xuất hàng (Consume)
1.  Gửi request `Consume Stock`.
2.  Kiểm tra Ledger.
    *   **Kỳ vọng**: Xuất hiện 1 dòng `Outbound` với `QuantityChange = -5` và `BalanceAfter = 0`.

---

## 3. Cách Verify "Chuẩn" (Data Integrity)

Để biết dữ liệu có khớp hay không, bạn hãy dùng SQL kiểm tra quy tắc:
**Số dư hiện tại = Tổng các QuantityChange trong Ledger.**

**Lệnh SQL kiểm tra:**
```sql
-- Lấy thông tin Snapshot
SELECT "Sku", "QuantityOnHand" 
FROM public."InventoryItems" 
WHERE "Id" = 'ID_CUA_BAN';

-- Tính toán từ Ledger
SELECT SUM("QuantityChange") as "CalculatedBalance" 
FROM public."InventoryLedgers" 
WHERE "InventoryItemId" = 'ID_CUA_BAN';
```
**Kết quả**: `QuantityOnHand` phải LUÔN LUÔN bằng `CalculatedBalance`. Nếu hai số này lệch nhau, hệ thống đang gặp lỗi nghiêm trọng về tính toàn vẹn dữ liệu.

---

## 4. Kiểm tra Traceability (Khả năng truy vết)
Trong kết quả trả về của API Ledger, hãy chú ý các trường:
*   `ReferenceId`: Sẽ khớp với `ReceiptId` (khi nhập) hoặc `OrderId` (khi xuất/giữ).
*   `OperatorSub`: Sẽ khớp với ID người dùng đã thực hiện hành động đó.
*   `CreatedAt`: Thời điểm chính xác xảy ra biến động.

## 5. Lưu ý cho Postman
1.  Hãy chạy request **`Get List Warehouses`** hoặc **`InventoryItems`** để lấy `inventoryItemId`.
2.  Gán ID đó vào biến môi trường `{{inventoryItemId}}`.
3.  Gọi **`Get Inventory Ledger`** để xem kết quả.
