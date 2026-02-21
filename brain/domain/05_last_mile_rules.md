# Domain: Last-mile Delivery Rules

## 1. Proof of Delivery (POD) Requirement

Để tránh tranh chấp khi khách báo chưa nhận được hàng.

- **Standard Delivery:** Bắt buộc chụp ảnh kiện hàng đặt tại cửa + Tọa độ GPS của tài xế lúc đó.
- **High Value Delivery:** Bắt buộc có chữ ký khách hàng trên màn hình điện thoại + OTP verify (gửi tới SĐT khách).
- **Rule:** Nếu thiếu POD, hệ thống không ghi nhận trạng thái `Delivered`.

## 2. COD (Cash On Delivery) Rules

- **Limit:** Mỗi tài xế chỉ được giữ tối đa **20.000.000 VNĐ** tiền mặt.
- **Block:** Nếu vượt quá hạn mức, App tài xế bị khóa tính năng nhận đơn mới cho đến khi nộp tiền về Hub/Chuyển khoản.
- **Reconciliation (Đối soát):** Cuối ngày, tài xế phải thực hiện "Chốt ca". Tổng tiền COD thực tế phải khớp với tổng tiền trên App. Sai lệch > 10.000đ phải giải trình.

## 3. Geofencing & Fake Location Protection

- Tài xế chỉ được bấm "Giao thành công" khi vị trí GPS của điện thoại nằm trong bán kính **200m** so với địa chỉ khách hàng.
- Phát hiện Fake GPS (Mock Location): App Mobile phải có cơ chế detect Mock Location Provider của Android. Nếu bật -> Block App.

## 4. Refund/Return (Giao thất bại) & Failed Delivery Logic

### First Attempt Failed

- **Driver Rule:** Driver phải gọi điện ít nhất 3 lần (cách nhau 5 phút).
- **Reason:** Note lý do cụ thể: `CustomerNotAnswer`, `WrongAddress`, `Refused`, `Reschedule`.
- **Action:** Tự động lên lịch attempt 2 trong vòng 24h.

### Second Attempt Failed

- **Escalation:** Bắt buộc **Hub Supervisor** gọi điện xác nhận với khách.
- **Customer Choice:**
  - Reschedule lần 3 (tính phí phụ).
  - Return to sender (RTS).

### Third Attempt Failed → RTS

- **Status:** Shipment status chuyển thành `ReturnInTransit`.
- **Finance:** COD amount reset to 0.
- **Fee:** Charge customer return fee (nếu lỗi xác định từ customer).

## 5. Damage & Loss Handling

### Package Damaged During Transit

- **Detection:** Driver report hoặc Customer complaint.
- **Process:**
  1.  Driver chụp ảnh hư hỏng (bắt buộc).
  2.  Không giao hàng, mang về Hub.
  3.  **QC Team** inspect và định giá thiệt hại.
  4.  **Insurance:** Claim bảo hiểm nếu giá trị > 5.000.000 VNĐ.

### Package Lost

- **Trigger:** Quá 7 ngày không có update tracking.
- **Actions:**
  - Auto-create **Incident Ticket**.
  - **Customer Care** gọi điện xác nhận.
  - **Refund:** Hoàn tiền 100% giá trị đơn hàng sau 10 ngày investigation.
  - **Penalty:** Phạt tài xế (nếu confirmed là driver trách nhiệm).
