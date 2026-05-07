# Hướng Dẫn Kỹ Thuật: Sổ Cái Tồn Kho (Ledger) & Đối Soát Tự Động (Reconciliation)

Tài liệu này cung cấp cái nhìn chi tiết về hệ thống Audit Trail của Warehouse Microservice, giúp đảm bảo tính toàn vẹn dữ liệu ở cấp độ Enterprise.

---

## 1. Kiến trúc Hệ Thống Audit

Hệ thống sử dụng mô hình **Dual-Persistence**:
*   **Snapshot (`InventoryItems`)**: Lưu trữ số dư hiện tại (Real-time balance) để phục vụ các thao tác bán hàng/giữ hàng nhanh chóng.
*   **Ledger (`InventoryLedgers`)**: Lưu trữ lịch sử biến động bất biến (Immutable log). Mỗi bản ghi Ledger là một "bằng chứng" cho sự thay đổi trong Snapshot.

### Thuật toán đối soát O(1)
Thay vì SUM toàn bộ lịch sử (rất chậm), hệ thống sử dụng trường `BalanceAfter` trong Ledger:
> **Quy tắc vàng**: `LatestLedger.BalanceAfter` == `CurrentSnapshot.QuantityOnHand`

---

## 2. Danh mục Nghiệp vụ (InventoryLedgerReason)

Mỗi giao dịch trong kho đều được gắn mã lý do cụ thể để phục vụ báo cáo:

| Mã (Enum) | Tên nghiệp vụ | DeltaQty | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `InboundReceived` | Nhập kho | `+N` | Hàng thực tế đi vào bin từ NCC. |
| `Reserve` | Giữ hàng | `0` | Chỉ thay đổi ReservedQty, không thay đổi vật lý. |
| `Release` | Hủy giữ | `0` | Trả lại ReservedQty về khả dụng. |
| `Ship` | Xuất kho | `-N` | Hàng thực tế đi ra khỏi kho (thường sau khi Consume). |
| `Expired` | Hết hạn | `0` | Hệ thống tự động giải phóng hàng giữ do quá hạn. |
| `AdjustIncrease` | Điều chỉnh tăng | `+N` | Thủ kho cân bằng lại sau khi phát hiện thiếu hụt. |
| `AdjustDecrease` | Điều chỉnh giảm | `-N` | Thủ kho cân bằng lại sau khi phát hiện dư thừa. |

---

## 3. Hướng dẫn Kiểm thử & Đối soát (Manual Verification)

### Kịch bản 1: Kiểm tra Traceability (Khả năng truy vết)
1.  Thực hiện **Nhập hàng** (Inbound).
2.  Lấy `inventoryItemId` từ response.
3.  Gọi API **`Get Inventory Ledger`**.
4.  **Verify**:
    *   Trường `ReferenceId` phải khớp với `ReceiptId`.
    *   Trường `ReferenceType` phải là `"Receipt"`.
    *   Trường `BalanceAfter` phải bằng đúng số lượng bạn vừa nhập.

### Kịch bản 2: Phát hiện sai lệch (Reconciliation)
Đây là cách bạn kiểm tra xem hệ thống đối soát có hoạt động không:

1.  **Phá hoại dữ liệu (Giả lập lỗi hệ thống)**:
    ```sql
    -- Giả sử SKU 'SKU001' đang có 100 cái. Hãy sửa nó thành 90 mà không qua Ledger.
    UPDATE "InventoryItems" SET "QuantityOnHand" = 90 WHERE "Sku" = 'SKU001';
    ```
2.  **Kích hoạt đối soát**: Chạy request Postman **`Reconcile Inventory`**.
3.  **Verify kết quả**:
    *   API trả về `discrepanciesFound: 1`.
    *   Truy vấn bảng báo cáo:
        ```sql
        SELECT * FROM "InventoryReconciliationReports" WHERE "Status" = 1; -- 1 = Pending
        ```
    *   **Kỳ vọng**: Bạn sẽ thấy một dòng báo cáo ghi rõ: `SnapshotQty = 90`, `LedgerQty = 100`, `Difference = -10`.

---

## 4. Các câu lệnh SQL hữu ích cho Admin

### Truy vấn lịch sử biến động của 1 SKU tại 1 kho:
```sql
SELECT "OccurredAt", "Reason", "DeltaQty", "BalanceAfter", "ReferenceId"
FROM "InventoryLedgers"
WHERE "Sku" = 'YOUR_SKU' AND "WarehouseId" = 'YOUR_WH_ID'
ORDER BY "OccurredAt" DESC;
```

### Tìm các báo cáo sai lệch chưa xử lý:
```sql
SELECT "Sku", "DetectedAt", "Difference", "SnapshotQty", "LedgerQty"
FROM "InventoryReconciliationReports"
WHERE "Status" = 1 -- Pending
ORDER BY "DetectedAt" DESC;
```

---

## 5. Lưu ý quan trọng cho Tester
*   Khi chạy Postman, hãy đảm bảo bạn đã **Re-import** bản mới nhất tôi vừa cập nhật.
*   Biến môi trường `{{inventoryItemId}}` cần được cập nhật đúng để API `Get Ledger` hoạt động.
*   Trạng thái `Expired` chỉ xuất hiện khi `ExpiredReservationCleanupWorker` (background task) chạy qua các bản ghi hết hạn.
