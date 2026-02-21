# Domain: WMS (Warehouse Management System) Rules

## 1. Inventory Strategy

- **Soft Reserve:** Khi OMS yêu cầu, WMS chỉ đánh dấu hàng là "Đang giữ" (`ReservedQty`), KHÔNG trừ ngay vào `QuantityOnHand`.
- **Hard Commit:** Khi đơn hàng hoàn tất đóng gói (`Packed`), mới chính thức trừ `QuantityOnHand`.
- **Rule:** `AvailableQty` = `QuantityOnHand` - `ReservedQty` - `DamagedQty`. Luôn kiểm tra `AvailableQty > 0` trước khi nhận đơn.

## 2. Inbound Process (Nhập kho)

1.  **Gate Check:** Xe hàng đến cổng -> Bảo vệ check biển số -> Tạo `GateEntry`.
2.  **Receiving:** Nhân viên quét mã PO/ASN. Kiểm đếm số lượng thực tế (`Blind Receipt` - không hiện số lượng báo trước để tránh nhân viên đếm lụi).
3.  **Quality Check (QC):** Lấy mẫu kiểm tra chất lượng. Hàng lỗi chuyển vào khu vực `Quarantine` (Cách ly).
4.  **Putaway:** Hệ thống chỉ định vị trí cất hàng (`BinLocation`).
    - _Logic:_ Hàng nặng để dưới thấp. Hàng bán chạy (`Fast Mover`) để gần khu đóng gói.

## 3. Outbound Process (Xuất kho)

Sử dụng chiến lược **Wave Picking** để tối ưu.

- **Batching:** Gom 50 đơn hàng có items nằm gần nhau thành 1 Wave.
- **Routing:** Vẽ được đi cho Picker theo hình chữ S (S-Shape) để không đi lặp lại.
- **Picking Strategy (CRITICAL):**
  - **FIFO (First In First Out):** Hàng vào trước xuất trước. Áp dụng cho: Hàng thời trang, electronics.
  - **FEFO (First Expired First Out):** Hàng gần hết hạn xuất trước. Áp dụng cho: Thực phẩm, mỹ phẩm, dược phẩm.
  - **Rule:** Không được phép xuất hàng có expiry date < 30 ngày (trừ có approval).
  - **Implementation Logic:**
    ```sql
    SELECT * FROM Inventory
    WHERE Sku = @sku AND AvailableQty > 0
    ORDER BY
      CASE WHEN @useFefo = 1 THEN ExpiryDate END ASC,
      CASE WHEN @useFifo = 1 THEN ReceivedDate END ASC
    LIMIT @requiredQty
    ```
- **Picking:**
  - Picker quét mã Bin -> Hệ thống báo số lượng cần lấy.
  - Picker quét mã Sản phẩm -> Confirm lấy.

## 4. Stock Count (Kiểm kê)

- **Cycle Count:** Kiểm kê xoay vòng hàng ngày (ví dụ: mỗi ngày kiểm 50 SKUs). Không đóng kho, vẫn xuất nhập bình thường.
- **Wall-to-wall Count:** Tổng kiểm kê (cuối năm). Đóng băng toàn bộ hoạt động kho.

## 5. Returns Management (Reverse Logistics)

### Receiving Returns

1.  **Handover:** Driver mang hàng về Hub -> Kho scan waybill để xác nhận "Received from Driver".
2.  **QC Check (Condition Inspection):**
    - `Sellable`: Mới nguyên, có thể bán lại. -> **Action:** Đưa về khu vực lưu kho bình thường.
    - `Damaged`: Hư hỏng bao bì/sản phẩm. -> **Action:** Chuyển khu vực `Quarantine` chờ thanh lý/trả NCC.
    - `TamperedPackage`: Có dấu hiệu bị bóc/tráo hàng. -> **Action:** Giữ nguyên hiện trường, báo cáo **Security Team**.

### Inventory Adjustment

- **Restore:** Chỉ cộng lại `QuantityOnHand` khi QC status = `Sellable`.
- **Loss/Damage:** Hàng hư hỏng tạo `AdjustmentNote` loại `Loss/Damage` (Không cộng vào stock khả dụng).
