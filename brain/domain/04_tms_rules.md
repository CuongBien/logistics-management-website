# Domain: TMS (Transportation Management System) Rules

## 1. Route Optimization Logic

Mục tiêu: Giảm tổng quãng đường di chuyển và tăng tỉ lệ lấp đầy xe (Load Factor).

### 1.1. Constraints (Các ràng buộc bắt buộc)

- **Time Window:** Phải giao hàng cho khách trong khung giờ khách chọn (ví dụ: 14:00 - 16:00).
- **Capacity:** Tổng trọng lượng (`Weight`) và thể tích (`Volume`) hàng hóa KHÔNG được vượt quá tải trọng xe.
- **Road Ban:** Xe tải lớn (>3.5 tấn) không được vào nội đô giờ cao điểm. -> Hệ thống phải có dữ liệu bản đồ cấm tải.

### 1.2. Cost Function (Hàm mục tiêu tối ưu)

`Cost = (Distance * FuelPrice) + (DriverSalary) + (VehicleDepreciation)`

- Thuật toán sẽ chạy mô phỏng hàng ngàn kịch bản (Metaheuristic Tabu Search) để tìm ra bộ lộ trình có `Cost` thấp nhất.

## 2. Consolidation (Gom đơn)

- Không giao từng đơn lẻ tẻ. Hệ thống tự động gom các đơn có cùng Hub đích đến vào một chuyến xe tải lớn (`Linehaul`).
- **Rule:** Mỗi chuyến xe Linehaul phải đạt tối thiểu 70% tải trọng mới được xuất bến (trừ trường hợp hàng cam kết 24h).

## 3. Vehicle & Driver Management

- **Driver Qualification:** Tài xế phải có bằng lái hạng C/D/E tương ứng với loại xe. Bằng lái hết hạn -> Block xếp lịch.
- **Vehicle Maintenance:** Xe phải được bảo dưỡng định kỳ (5000km/lần). Nếu quá hạn bảo dưỡng -> Cảnh báo đỏ trên hệ thống điều phối, không cho phân chuyến đi xa.

## 4. Linehaul & Multi-modal Transport

**Scenario:** Long-distance transport (e.g., HCM -> Hanoi, ~1800km).

### Mode Selection Logic

- **Distance < 300km:** Trucking only.
- **Distance 300-800km:** Compare Trucking vs Rail cost. Choose cheaper option.
- **Distance > 800km:**
  - **Urgent (< 24h):** Air Freight.
  - **Standard:** Rail (train) or Trucking (container).

### Handoff Points (Intermodal)

Mỗi lần chuyển đổi phương thức vận tải (Truck -> Air -> Truck), hệ thống phải ghi nhận `HandoffEvent`:

- **Data:** Origin Hub/Mode, Destination Hub/Mode.
- **Timestamp:** Thời gian bàn giao thực tế.
- **Signature:** Chữ ký xác nhận của người chịu trách nhiệm (Driver A -> Airport Agent -> Driver B).
