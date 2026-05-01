# Warehouse Exception Management Schema (ERD)

Sơ đồ dưới đây mở rộng cấu trúc cơ sở dữ liệu hiện tại để hỗ trợ quy trình xử lý ngoại lệ khi nhập kho (Inbound Receipt Exceptions) như đã thống nhất (hàng hỏng, sai lệch số lượng, chuyển vào Quarantine/RTV).

```mermaid
erDiagram
    InboundReceipts ||--|{ InboundReceiptLines : "contains"
    InboundReceiptLines }|--|| InventoryItems : "generates"
    InventoryItems }|--|| Bins : "stored in"
    
    InboundReceipts {
        uuid id PK
        string status "PENDING, PARTIAL, COMPLETED, COMPLETED_WITH_EXCEPTIONS"
        datetime expected_at
        datetime actual_received_at
    }
    
    InboundReceiptLines {
        uuid id PK
        uuid receipt_id FK
        string sku_code
        int expected_qty
        int received_qty
        int rejected_qty "NEW: Số lượng bị từ chối/lỗi"
        string rejection_reason "NEW: Lý do (DAMAGED, WRONG_ITEM, NOT_ORDERED)"
        string status "NEW: PENDING, PARTIALLY_RECEIVED, QUARANTINED, COMPLETED"
        string lot_no
        datetime expiry_date
    }
    
    InventoryItems {
        uuid id PK
        string sku_code
        uuid warehouse_id FK
        uuid bin_id FK
        int qty_on_hand
        int qty_reserved
        string inventory_status "NEW: AVAILABLE, BLOCKED, QUARANTINED, DAMAGED"
        int version "OCC"
        datetime last_restocked_at
    }
    
    Bins {
        uuid id PK
        uuid zone_id FK
        string bin_code
        string bin_type "NEW: STANDARD, QUARANTINE, HOLD_STAGE, SCRAP"
        string status
        int version
    }

    DispositionLogs {
        uuid id PK
        uuid inbound_line_id FK
        uuid inventory_item_id FK "NEW: Theo dõi lịch sử xử lý"
        string action "QUARANTINE_ENTER, TRANSFER_APPROVED, SCRAP_APPROVED, RELEASED"
        datetime action_date
        string operator_id
        string notes
    }
    
    InboundReceiptLines ||--o{ DispositionLogs : "tracked by"
```

### Các Thay Đổi Chính Theo Mô Hình 3PL:
1. **`InboundReceiptLines`**: 
   - Thêm `rejected_qty` và `rejection_reason` để ghi nhận trực tiếp trên Line số hàng bị lỗi lúc dỡ container/xe tải.
2. **`InventoryItems`**: 
   - Thay `RTV` bằng `DAMAGED`. 3PL không có quyền tự ý trả hàng cho Vendor. Hàng hỏng được đánh dấu `DAMAGED` để hệ thống WMS tuyệt đối không cấp phát (allocate) cho đơn hàng B2C/B2B đi người mua cuối, nhưng vẫn cho phép xuất luân chuyển (Transfer Order) sang kho khác.
3. **`Bins`**:
   - Thay `RTV_STAGE` bằng `HOLD_STAGE`. Đây là khu vực tập kết tạm để chờ đưa lên xe tải xuất đi kho xử lý tập trung hoặc kho khác theo lệnh của Client.
4. **`DispositionLogs` (Thay cho QuarantineLogs)**:
   - Dùng để lưu vết quá trình ra quyết định của Chủ hàng (Client) đối với hàng lỗi.
   - `TRANSFER_APPROVED`: Lệnh xuất luân chuyển đi kho khác.
   - `SCRAP_APPROVED`: Lệnh tiêu hủy tại chỗ.
   - `RELEASED`: Lệnh tái nhập kho (hàng không sao cả, xước nhẹ, vẫn bán được).
