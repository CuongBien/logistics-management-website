# Tư Vấn Kiến Trúc Phần Mềm (DDD) - Quản Lý Kho & Tiếp Nhận Hàng Hóa

Tài liệu này cung cấp các phân tích và khuyến nghị kiến trúc dựa trên nguyên tắc Domain-Driven Design (DDD) cho các vấn đề thiết kế trong luồng Inbound Management (Task B).

---

## 1. Phân định Module Boundary cho `DispositionLog`

### Phân tích
*   `DispositionLog` ghi nhận các định đoạt (disposition) như Quarantine (cách ly), Scrap (hủy), Transfer (chuyển đổi) đối với hàng hóa.
*   Nó chứa 2 ID: `InboundLineId` (nơi sinh ra vấn đề) và `InventoryItemId` (thực thể chịu tác động vật lý).
*   **Inbound Bounded Context** chịu trách nhiệm tiếp nhận, đối chiếu số lượng và đưa hàng vào vị trí tạm/nhận. Khi hàng đã được dán nhãn "Hỏng" hoặc "Cách ly" và sinh ra `RejectedQty`, trách nhiệm cốt lõi của Inbound đã kết thúc.
*   **Inventory Bounded Context** chịu trách nhiệm quản lý vòng đời, trạng thái (Available, Damaged, Quarantined) và vị trí của hàng hóa. Quá trình QA (Quality Assurance) hoặc xử lý hàng lỗi là một hành vi quản lý tồn kho.

### Khuyến nghị
Nên đặt `DispositionLog` thuộc về module **Inventory** (hoặc một Sub-domain Quality Assurance nằm trong Inventory Context).

### Lý do (DDD Principles)
1.  **Encapsulation (Tính bao đóng):** Về mặt khái niệm, một Log (Nhật ký) là một danh từ mang tính chất "lưu vết lịch sử" (Event), nó không phải là một "hành vi" (Behavior/Command). Nhật ký không có quyền năng để can thiệp và sửa trạng thái của một thực thể khác. Trong DDD, thực thể `InventoryItem` phải tự quản lý trạng thái của chính nó. Luồng chuẩn phải là: Người dùng phát lệnh QA (Command) -> Hệ thống gọi hàm `inventoryItem.ChangeStatus(Damaged)` -> Sau khi đổi trạng thái thành công, hệ thống mới sinh ra (insert) một `DispositionLog` để ghi lại lịch sử. Do đó, `DispositionLog` là "kết quả" của quá trình quản lý vòng đời `InventoryItem`, nên việc nó nằm trong module Inventory là hoàn toàn chính xác.
2.  **Cross-context Reference (Soft Link):** Khóa ngoại `InboundLineId` nằm trong `DispositionLog` không nên là một Hard FK Constraint ở mức Database (nếu hệ thống hướng tới Microservices). Theo DDD, đây chỉ là một **Soft Link** lưu giữ UUID để phục vụ truy xuất nguồn gốc (Traceability), giúp Inventory Context biết được lô hàng lỗi này bắt nguồn từ chứng từ nhập nào, mà không tạo ra sự ràng buộc chặt chẽ (tight-coupling) về mặt transaction với module Inbound.

### Rủi ro tiềm tàng
*   Việc truy vấn các báo cáo hiển thị "Chi tiết dòng nhập hàng kèm theo kết quả xử lý ngoại lệ" sẽ cần thực hiện JOIN chéo module (nếu dùng chung DB) hoặc API Composition/CQRS Read Model (nếu tách DB). Điều này làm tăng độ phức tạp ở lớp Query.

---

## 2. Quy tắc Complete cho `InboundReceiptLine`

### Phân tích
*   **Phương án A (Strict):** Đảm bảo an toàn dữ liệu tuyệt đối nhưng đi ngược lại với thực tế hỗn loạn của chuỗi cung ứng (nhà cung cấp giao thiếu, rớt hàng dọc đường).
*   **Phương án B (Flexible):** Phản ánh đúng thực tế nhưng dễ dẫn đến dữ liệu rác hoặc nhân viên quên kiểm hàng.

### Khuyến nghị
Áp dụng **Phương án B (Flexible)** nhưng đi kèm với khái niệm **"Short Close" (Đóng thiếu) / "Force Close"**.
Hệ thống KHÔNG tự động đóng Partially, mà yêu cầu một hành vi (Behavior) rõ ràng từ người dùng.

### Lý do (DDD Principles)
1.  **Ubiquitous Language & Domain Behavior:** Thực tế kho bãi luôn có "Giao thiếu" (Shortage). Domain Model phải thể hiện được hành vi này thông qua một Command rõ ràng (ví dụ: `CloseInboundLineCommand(Force = true)`).
2.  Hệ thống sẽ tự động chuyển sang `Completed` **chỉ khi** `ReceivedQty + RejectedQty = ExpectedQty`.
3.  Nếu tổng nhỏ hơn `ExpectedQty`, dòng đó giữ ở trạng thái `PartiallyReceived`. Người dùng phải chủ động gọi lệnh "Short Close" để ép đóng. Khi đó, hệ thống sinh ra một trường ẩn hoặc một Domain Event ghi nhận `ShortageQty` (Số lượng hao hụt). Điều này vừa đáp ứng tính linh hoạt, vừa bảo vệ tính toàn vẹn vì mọi hao hụt đều được ghi nhận (audited) một cách có chủ đích.

### Rủi ro tiềm tàng
*   Nhân viên kho có thể lạm dụng nút "Force Close" khi lười kiểm đếm. Để giảm thiểu, cần phân quyền (Permission) hoặc yêu cầu xác nhận từ Quản lý (Approval) đối với những lệnh Short Close có số lượng hao hụt lớn.

---

## 3. Chuẩn hóa Status cho `InboundReceiptStatus`

### Phân tích
*   Chữ `Received` (Đã nhận) mang tính chất hành động vật lý.
*   Chữ `Completed` (Đã hoàn tất) mang ý nghĩa quy trình quản trị (Workflow state).

### Khuyến nghị
Đồng thuận với việc chuẩn hóa sử dụng từ khóa `Completed` và `CompletedWithExceptions`, đồng thời đề xuất bộ State Machine hoàn chỉnh sau:
`Draft` -> `Pending` -> `Receiving` (Đang nhận) -> `Completed` / `CompletedWithExceptions` -> `Closed` (Đã khóa). Có thể nhảy sang `Cancelled` nếu cần hủy.

### Lý do (DDD Principles)
1.  **Domain Events Explicitly:** Trạng thái `CompletedWithExceptions` là cực kỳ quan trọng trong DDD. Nó đóng vai trò phát ra một Integration Event (ví dụ: `InboundCompletedWithExceptionsEvent`) để trigger các Sub-domain khác. Ví dụ: Module Purchasing/Billing lắng nghe event này để tự động trừ tiền nhà cung cấp hoặc tự động tạo ticket khiếu nại.
2.  **Tách biệt giữa Vận hành và Tài chính:**
    *   `Completed` / `CompletedWithExceptions`: Trạng thái của Kho (Warehouse). Nhân viên kho đã làm xong việc, không còn tác vụ nào trên xe nâng hay máy quét mã vạch.
    *   `Closed`: Trạng thái Kế toán/Hệ thống. Biên nhận này đã được đồng bộ với ERP, đã đối soát công nợ xong và bị khóa hoàn toàn, không ai được phép sửa đổi nữa.

### Rủi ro tiềm tàng
*   Sự đa dạng của các trạng thái (đặc biệt là rẻ nhánh giữa `Completed` và `CompletedWithExceptions`) làm phức tạp hóa State Machine. Cần lập trình chặt chẽ các điều kiện chuyển đổi (Transition Guards) để đảm bảo không có trạng thái rác (ví dụ: không thể chuyển từ `Closed` ngược về `Receiving`).
