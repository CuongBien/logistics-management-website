# Product Backlog (Chỉ Bao Gồm Business Logic)

> Phạm vi: chỉ bao gồm chức năng nghiệp vụ và quy tắc xử lý nghiệp vụ (không có tác vụ kỹ thuật).

## Chú thích mức độ ưu tiên
- **P1** = bắt buộc cho vận hành cốt lõi
- **P2** = nên có để vận hành ổn định
- **P3** = nên có thêm để nâng cao

---

## 1) Module: Quản lý Đơn hàng (OMS)

- [ ] **P1 - Tạo đơn hàng**  
  Ghi nhận thông tin người gửi/người nhận, dòng hàng, tùy chọn dịch vụ và khởi tạo trạng thái đơn.
- [ ] **P1 - Kiểm tra điều kiện hợp lệ của đơn**  
  Từ chối dữ liệu đơn không hợp lệ và tổ hợp dịch vụ không được hỗ trợ trước khi xử lý.
- [ ] **P1 - Xem chi tiết đơn hàng**  
  Cho phép người dùng xem đầy đủ thông tin đơn và trạng thái vòng đời hiện tại.
- [ ] **P1 - Xác nhận đơn hàng**  
  Chuyển đơn từ trạng thái mới sang xác nhận khi đủ điều kiện.
- [ ] **P1 - Hủy đơn hàng**  
  Chỉ cho phép hủy ở các giai đoạn hợp lệ và lưu lý do hủy.
- [ ] **P1 - Áp dụng quy tắc chuyển trạng thái đơn**  
  Đảm bảo mọi thay đổi trạng thái tuân thủ quy tắc nghiệp vụ (không nhảy trạng thái sai).
- [ ] **P2 - Xử lý giao thất bại và giao lại**  
  Ghi nhận lý do thất bại, tăng số lần giao và hỗ trợ luồng điều phối giao lại.
- [ ] **P2 - Hoàn tất đóng đơn**  
  Chỉ đánh dấu hoàn tất khi thỏa đầy đủ điều kiện giao thành công cuối cùng.

---

## 2) Module: Quản lý Nhập kho (Warehouse Receiving)

- [ ] **P1 - Tạo kế hoạch nhập kho (ASN / yêu cầu nhập)**  
  Đăng ký hàng dự kiến nhập trước khi hàng đến thực tế.
- [ ] **P1 - Check-in xe đến và phân bến nhận hàng**  
  Ghi nhận xe đến và điều hướng tới điểm nhận phù hợp.
- [ ] **P1 - Nhận hàng và đối soát**  
  So sánh số lượng/tình trạng thực nhận với kế hoạch dự kiến.
- [ ] **P1 - Ghi nhận xử lý chênh lệch**  
  Lưu kết quả thừa/thiếu/hư hỏng cho từng dòng nhập.
- [ ] **P1 - Thực hiện cất hàng vào vị trí lưu trữ (putaway)**  
  Di chuyển hàng đã nhận vào vị trí lưu trữ hợp lệ và xác nhận hoàn tất.
- [ ] **P2 - Đóng phiếu nhập kho**  
  Hoàn tất nghiệp vụ nhập và cho phép tồn kho sẵn sàng phục vụ xuất hàng.

---

## 3) Module: Quản lý Tồn kho (WMS)

- [ ] **P1 - Tạo mặt hàng tồn kho (SKU trong ngữ cảnh kho)**  
  Khởi tạo SKU với các thuộc tính quản lý tồn kho ban đầu.
- [ ] **P1 - Duy trì số liệu tồn thực tế / giữ chỗ / khả dụng**  
  Đảm bảo số liệu chính xác sau mọi nghiệp vụ giữ chỗ, nhả giữ chỗ và trừ kho.
- [ ] **P1 - Giữ chỗ tồn kho cho đơn hàng**  
  Giữ tồn theo nhu cầu đơn hàng và ngăn bán vượt tồn.
- [ ] **P1 - Nhả giữ chỗ tồn kho**  
  Trả lượng giữ chỗ về tồn khả dụng khi đơn bị hủy/thất bại.
- [ ] **P1 - Xác nhận trừ kho khi bàn giao xuất**  
  Trừ tồn vật lý khi xác nhận bàn giao hàng đi.
- [ ] **P2 - Luồng nhập bù (restock)**  
  Tăng tồn khả dụng theo kết quả nhập kho hoặc hoàn hàng được duyệt.
- [ ] **P2 - Tra cứu tồn theo SKU**  
  Cung cấp trạng thái tồn theo thời gian thực cho vận hành và khách hàng.

---

## 4) Module: Fulfillment Xuất kho B2C (Thương mại điện tử)

- [ ] **P1 - Tiếp nhận đơn đa kênh**  
  Nhận và chuẩn hóa đơn từ nhiều kênh bán.
- [ ] **P1 - Phân bổ tồn cho đơn B2C**  
  Khóa tồn cho từng đơn trước khi bắt đầu lấy hàng.
- [ ] **P1 - Lập sóng/mẻ lấy hàng**  
  Gom các đơn tương thích để tối ưu thực thi lấy hàng.
- [ ] **P1 - Thực hiện lấy hàng và xác nhận**  
  Xác nhận số lượng đã lấy theo từng dòng đơn.
- [ ] **P1 - Đóng gói và sẵn sàng giao**  
  Kiểm tra tính đúng đủ khi đóng gói và đánh dấu sẵn sàng xuất.
- [ ] **P1 - Bàn giao cho đơn vị giao chặng cuối**  
  Chuyển giao trách nhiệm lô hàng và cập nhật trạng thái đã xuất.

---

## 5) Module: Fulfillment Xuất kho B2B (Phân phối/Bán sỉ)

- [ ] **P1 - Xử lý đơn xuất số lượng lớn**  
  Hỗ trợ xuất theo kiện/thùng/pallet cho đơn khối lượng lớn.
- [ ] **P1 - Phân bổ tồn theo ràng buộc nghiệp vụ**  
  Phân bổ theo lô/date/chính sách khách hàng.
- [ ] **P1 - Thực thi lấy hàng số lượng lớn và tập kết**  
  Lấy hàng theo đơn vị lớn và tập kết theo lô giao của khách.
- [ ] **P1 - Thực hiện yêu cầu xử lý gia tăng**  
  Hỗ trợ dán nhãn/đóng gói lại/kitting trước khi xuất.
- [ ] **P1 - Gom lô hàng sẵn sàng vận chuyển**  
  Hợp nhất nhiều đơn vị xử lý thành lô hàng sẵn sàng giao vận.
- [ ] **P1 - Xuất hàng có xác nhận bàn giao**  
  Xác nhận bàn giao cho vận tải và đóng nghiệp vụ xuất kho.

---

## 6) Module: Vòng đời Vận chuyển & Giao hàng

- [ ] **P1 - Quản lý sự kiện lấy hàng**  
  Ghi nhận hàng đã được lấy từ nguồn gửi.
- [ ] **P1 - Quản lý sự kiện nhận tại kho trung chuyển**  
  Ghi nhận bàn giao vào kho trong hành trình vận chuyển.
- [ ] **P1 - Quản lý sự kiện phân loại và điều phối đi**  
  Chuyển lô hàng sang giai đoạn vận chuyển đầu ra.
- [ ] **P1 - Quản lý sự kiện giao thành công**  
  Ghi nhận giao cuối cùng thành công kèm bằng chứng hoàn tất.
- [ ] **P1 - Quản lý sự kiện giao thất bại**  
  Ghi nhận lý do thất bại và định tuyến sang luồng giao lại/hoàn hàng.
- [ ] **P2 - Dòng thời gian theo dõi lô hàng end-to-end**  
  Cung cấp lịch sử trạng thái theo trình tự thời gian cho nội bộ và đối tác.

---

## 7) Module: Logistics ngược (Returns/RMA)

- [ ] **P1 - Tạo yêu cầu hoàn trả (RMA)**  
  Đăng ký yêu cầu hoàn đã duyệt kèm lý do và số lượng dự kiến.
- [ ] **P1 - Nhận hàng hoàn vào khu cách ly**  
  Tách hàng hoàn khỏi tồn có thể bán khi tiếp nhận.
- [ ] **P1 - Kiểm định tình trạng hàng hoàn**  
  Đánh giá chất lượng và phân loại kết quả tình trạng.
- [ ] **P1 - Áp dụng quyết định xử lý sau kiểm định**  
  Quyết định nhập lại, tân trang, trả nhà cung cấp hoặc thanh lý.
- [ ] **P1 - Kích hoạt đóng nghiệp vụ tài chính liên quan**  
  Ghi nhận kết quả hoàn để phục vụ quy tắc hoàn tiền/thu thêm.
- [ ] **P2 - Đóng hồ sơ hoàn trả**  
  Hoàn tất vòng đời RMA với trạng thái cuối có thể kiểm toán.

---

## 8) Module: Dịch vụ Khách hàng & Đối tác

- [ ] **P1 - Tra cứu trạng thái đơn/giao vận**  
  Cho phép khách hàng/đối tác xem trạng thái hiện tại của đơn và lô hàng.
- [ ] **P1 - Thông báo thời gian thực theo mốc trạng thái**  
  Gửi thông báo khi có thay đổi trạng thái quan trọng.
- [ ] **P2 - Quy trình xử lý sự cố khách hàng**  
  Ghi nhận và theo dõi sự cố (trễ, hư hỏng, sai lệch).
- [ ] **P2 - Hiển thị ngoại lệ SLA**  
  Hiển thị ca trễ/thất bại cần can thiệp dịch vụ.

---

## 9) Module: Tính phí, COD & Đối soát

- [ ] **P1 - Tính phí dịch vụ theo đơn/lô hàng**  
  Áp dụng quy tắc giá đã thỏa thuận cho dịch vụ logistics.
- [ ] **P1 - Vòng đời đối soát COD**  
  Theo dõi COD đã thu, đối soát và trạng thái chi trả.
- [ ] **P2 - Điều chỉnh tài chính liên quan hoàn trả**  
  Áp dụng hoàn phí/thu thêm theo kết quả xử lý hàng hoàn.
- [ ] **P2 - Xử lý tranh chấp và điều chỉnh**  
  Quản lý quy trình điều chỉnh khi lệch số liệu tính phí.

---

## 10) Module: Điều hành Vận hành & KPI

- [ ] **P2 - Chỉ số hiệu suất fulfillment**  
  Đo thời gian chu trình từ tiếp nhận đơn đến bàn giao xuất.
- [ ] **P2 - Chỉ số hiệu suất giao hàng**  
  Theo dõi tỷ lệ đúng hẹn, tỷ lệ thất bại và tỷ lệ giao lại.
- [ ] **P2 - Chỉ số chất lượng tồn kho**  
  Theo dõi độ chính xác tồn, độ tin cậy giữ chỗ và tuổi tồn.
- [ ] **P3 - Dashboard chất lượng dịch vụ**  
  Cung cấp góc nhìn KPI tổng hợp theo khách hàng/module/thời gian.

---

## Thứ tự triển khai gợi ý (Business-first)

1. **Luồng lõi P1:** Quản lý đơn hàng → Quản lý tồn kho → Xuất kho B2C → Sự kiện vận chuyển  
2. **Mở rộng P1:** Nhập kho → Logistics ngược → Xuất kho B2B  
3. **Tối ưu P2/P3:** Nâng cao dịch vụ khách hàng, tinh chỉnh đối soát tài chính, phân tích KPI
