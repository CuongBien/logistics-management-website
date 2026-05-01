# Tài liệu Use Case Chi Tiết (Hợp Nhất)

> Tài liệu này **kết hợp nội dung từ 2 file sơ đồ**:
> - `PBL3-Page-4.drawio.xml`
> - `08-usecase-tree-super-detailed.drawio`
>
> Mục tiêu: diễn giải use case theo ngôn ngữ dễ hiểu, có tính phân cấp, và giữ logic phụ thuộc trước-sau (must-exist-before).

---

## 1) Danh sách Actor (người dùng)

### External
- **Merchant / Chủ hàng**: tạo yêu cầu nhập/xuất, theo dõi trạng thái.
- **Khách nhận hàng**: theo dõi giao hàng, tạo yêu cầu hoàn/khách khiếu nại.

### Internal
- **Admin**: theo dõi tổng quan vận hành.
- **Nhân viên điều phối đơn hàng**: xử lý đơn, lập kế hoạch xuất.
- **Nhân viên kho**: nhận hàng, cất hàng, lấy hàng, đóng gói.
- **Quản lý kho**: duyệt, quyết định xử lý hàng đặc biệt.
- **Nhân viên điều phối vận tải**: bàn giao và điều phối lô hàng vận chuyển.
- **Nhân viên CSKH**: tra cứu, xử lý khiếu nại và ngoại lệ SLA.
- **Kế toán tài chính**: tính phí, COD, đối soát, xử lý chênh lệch.

---

## 2) Cây phụ thuộc chính (Dead-Alive Dependency)

```text
Tạo đơn -> Kiểm tra hợp lệ -> Xác nhận đơn
      -> Kiểm tra tồn / giữ chỗ
      -> Lập kế hoạch lấy hàng
      -> Lấy hàng -> Đóng gói -> Bàn giao vận chuyển
      -> Cập nhật trạng thái giao (thành công/thất bại)
      -> (nếu thất bại) giao lại hoặc tạo RMA
      -> Đóng đơn

Nhập kho:
Tạo kế hoạch nhập (ASN)
-> Check-in và phân bến
-> Nhận hàng & đối soát
-> Ghi nhận chênh lệch
-> Putaway
-> Đóng phiếu nhập
-> Cập nhật tồn khả dụng
```

---

## 3) Use Case chi tiết theo module

---

## Module A - Quản lý Đơn hàng

### UC-01: Tạo đơn hàng
- **Actor chính**: Merchant, Nhân viên điều phối đơn hàng
- **Mục tiêu**: tạo mới đơn để bắt đầu luồng xử lý.
- **Điều kiện trước**: người dùng đã đăng nhập và có quyền tạo đơn.
- **Kết quả**: đơn được tạo ở trạng thái khởi tạo.
- **Luồng chính**:
  1. Người dùng nhập thông tin gửi/nhận và danh sách hàng.
  2. Hệ thống kiểm tra trường dữ liệu bắt buộc.
  3. Hệ thống tạo mã đơn và lưu đơn.
  4. Hệ thống trả về thông tin đơn vừa tạo.
- **Ngoại lệ**: thiếu dữ liệu bắt buộc, định dạng sai.

### UC-02: Kiểm tra hợp lệ đơn
- **Actor chính**: Nhân viên điều phối đơn hàng
- **Phụ thuộc**: UC-01
- **Mục tiêu**: đảm bảo đơn đáp ứng quy tắc nghiệp vụ.
- **Kết quả**: đơn được chấp nhận hoặc bị từ chối kèm lý do.
- **Luồng chính**:
  1. Chọn đơn cần kiểm tra.
  2. Hệ thống kiểm tra tính hợp lệ theo rule.
  3. Hiển thị kết quả pass/fail.
- **Ngoại lệ**: rule xung đột hoặc thiếu dữ liệu tham chiếu.

### UC-03: Xác nhận đơn
- **Actor chính**: Nhân viên điều phối đơn hàng
- **Phụ thuộc**: UC-02
- **Mục tiêu**: chuyển đơn sang trạng thái sẵn sàng fulfillment.
- **Kết quả**: đơn ở trạng thái đã xác nhận.
- **Luồng chính**:
  1. Mở đơn đã hợp lệ.
  2. Chọn hành động “Xác nhận đơn”.
  3. Hệ thống cập nhật trạng thái và ghi log.

### UC-04: Xem chi tiết đơn
- **Actor chính**: Merchant, CSKH, Điều phối
- **Mục tiêu**: tra cứu thông tin và tiến độ xử lý đơn.
- **Kết quả**: hiển thị đầy đủ trạng thái và lịch sử cập nhật.

### UC-05: Hủy đơn
- **Actor chính**: Merchant, Điều phối
- **Điều kiện trước**: đơn chưa vượt trạng thái cho phép hủy.
- **Kết quả**: đơn bị hủy, lý do hủy được lưu.
- **Luồng chính**:
  1. Người dùng chọn “Hủy đơn”.
  2. Nhập lý do hủy.
  3. Hệ thống kiểm tra điều kiện hủy.
  4. Cập nhật trạng thái hủy.
- **Nhánh phụ thuộc**: có thể kích hoạt UC-15 (Nhả giữ chỗ tồn).

### UC-06: Xử lý giao thất bại / giao lại
- **Actor chính**: Điều phối, CSKH
- **Điều kiện trước**: đơn có trạng thái giao thất bại.
- **Kết quả**: đơn được chuyển giao lại hoặc sang luồng hoàn.

### UC-07: Đóng đơn hoàn tất
- **Actor chính**: Điều phối
- **Phụ thuộc**: giao thành công hoặc kết thúc đúng nghiệp vụ.
- **Kết quả**: đơn chuyển trạng thái “hoàn tất”.

---

## Module B - Quản lý Nhập kho

### UC-08: Tạo kế hoạch nhập (ASN)
- **Actor chính**: Merchant, Quản lý kho
- **Mục tiêu**: đăng ký hàng sẽ nhập trước khi hàng đến.
- **Kết quả**: kế hoạch nhập ở trạng thái chờ tiếp nhận.

### UC-09: Check-in xe đến + phân bến
- **Actor chính**: Quản lý kho
- **Phụ thuộc**: UC-08
- **Mục tiêu**: ghi nhận xe đến và phân khu nhận hàng.

### UC-10: Nhận hàng và đối soát
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-09
- **Mục tiêu**: kiểm tra số lượng/tình trạng thực tế so với kế hoạch.
- **Kết quả**: biên bản nhận hàng được ghi nhận.

### UC-11: Ghi nhận chênh lệch
- **Actor chính**: Nhân viên kho, Quản lý kho
- **Phụ thuộc**: UC-10
- **Mục tiêu**: lưu thừa/thiếu/hỏng để xử lý rõ ràng.

### UC-12: Putaway vào vị trí lưu trữ
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-10 hoặc UC-11
- **Mục tiêu**: cất hàng vào vị trí hợp lệ trong kho.
- **Kết quả**: hàng được gắn vị trí lưu trữ.

### UC-13: Đóng phiếu nhập
- **Actor chính**: Quản lý kho
- **Phụ thuộc**: UC-12
- **Mục tiêu**: kết thúc nghiệp vụ nhập kho.
- **Kết quả**: tồn khả dụng được cập nhật.

---

## Module C - Quản lý Tồn kho

### UC-14: Tạo SKU tồn kho
- **Actor chính**: Quản lý kho
- **Mục tiêu**: khởi tạo mã hàng trong phạm vi kho.

### UC-15: Giữ chỗ tồn cho đơn
- **Actor chính**: Điều phối đơn hàng
- **Phụ thuộc**: UC-03, UC-14
- **Mục tiêu**: khóa số lượng tồn cho đơn đã xác nhận.

### UC-16: Nhả giữ chỗ tồn
- **Actor chính**: Điều phối đơn hàng, Quản lý kho
- **Phụ thuộc**: UC-05 hoặc UC-06
- **Mục tiêu**: trả lại tồn khả dụng khi đơn không tiếp tục.

### UC-17: Xác nhận trừ kho khi bàn giao
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-22 (Bàn giao chặng cuối) / UC-28 (xuất B2B)
- **Mục tiêu**: trừ tồn vật lý đúng thời điểm bàn giao.

### UC-18: Restock sau nhập/hoàn
- **Actor chính**: Quản lý kho
- **Phụ thuộc**: UC-13 hoặc UC-33
- **Mục tiêu**: đưa hàng hợp lệ trở lại tồn khả dụng.

### UC-19: Tra cứu tồn theo SKU
- **Actor chính**: Merchant, Quản lý kho, CSKH
- **Mục tiêu**: xem tồn on-hand/reserved/available theo thời gian thực.

---

## Module D - Fulfillment B2C

### UC-20: Tiếp nhận đơn đa kênh
- **Actor chính**: Điều phối đơn hàng
- **Mục tiêu**: gom và chuẩn hóa đơn từ các kênh bán.

### UC-21: Lập sóng/mẻ lấy hàng
- **Actor chính**: Điều phối đơn hàng
- **Phụ thuộc**: UC-15
- **Mục tiêu**: tối ưu năng suất lấy hàng.

### UC-22: Thực hiện lấy hàng & đóng gói
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-21
- **Mục tiêu**: chuẩn bị hàng chính xác để giao.

### UC-23: Bàn giao chặng cuối
- **Actor chính**: Nhân viên kho, Điều phối vận tải
- **Phụ thuộc**: UC-22
- **Mục tiêu**: chuyển trách nhiệm lô hàng sang vận chuyển.

---

## Module E - Fulfillment B2B

### UC-24: Xử lý đơn xuất số lượng lớn
- **Actor chính**: Điều phối đơn hàng
- **Mục tiêu**: tạo kế hoạch xử lý cho đơn bulk.

### UC-25: Phân bổ theo lot/date/chính sách
- **Actor chính**: Điều phối đơn hàng, Quản lý kho
- **Phụ thuộc**: UC-24
- **Mục tiêu**: phân bổ đúng ràng buộc khách hàng.

### UC-26: Lấy hàng bulk + tập kết
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-25

### UC-27: Xử lý gia tăng (VAS)
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-26

### UC-28: Gom lô + xuất hàng có xác nhận bàn giao
- **Actor chính**: Điều phối vận tải, Nhân viên kho
- **Phụ thuộc**: UC-27

---

## Module F - Vận chuyển & Giao hàng

### UC-29: Ghi nhận sự kiện lấy hàng
- **Actor chính**: Điều phối vận tải
- **Phụ thuộc**: UC-23 hoặc UC-28

### UC-30: Ghi nhận trung chuyển / phân loại
- **Actor chính**: Điều phối vận tải
- **Phụ thuộc**: UC-29

### UC-31: Ghi nhận giao thành công
- **Actor chính**: Điều phối vận tải
- **Phụ thuộc**: UC-30
- **Kết quả**: có thể đóng đơn (UC-07).

### UC-32: Ghi nhận giao thất bại
- **Actor chính**: Điều phối vận tải, CSKH
- **Phụ thuộc**: UC-30
- **Kết quả**: sang UC-06 hoặc UC-33.

### UC-33: Theo dõi timeline vận đơn
- **Actor chính**: Merchant, Khách nhận hàng, CSKH
- **Mục tiêu**: tra cứu trạng thái theo chuỗi thời gian.

---

## Module G - Logistics ngược (RMA)

### UC-34: Tạo yêu cầu hoàn trả (RMA)
- **Actor chính**: Khách nhận hàng, CSKH
- **Phụ thuộc**: UC-32 hoặc yêu cầu chủ động từ khách.

### UC-35: Nhận hàng hoàn vào cách ly
- **Actor chính**: Nhân viên kho
- **Phụ thuộc**: UC-34

### UC-36: Kiểm định và quyết định xử lý hàng hoàn
- **Actor chính**: Nhân viên kho, Quản lý kho
- **Phụ thuộc**: UC-35
- **Nhánh kết quả**:
  - Nhập lại kho -> UC-18
  - Trả NCC / Thanh lý -> ghi nhận tài chính UC-37

### UC-37: Kích hoạt xử lý tài chính hoàn trả
- **Actor chính**: Kế toán tài chính
- **Phụ thuộc**: UC-36

### UC-38: Đóng hồ sơ hoàn trả
- **Actor chính**: CSKH
- **Phụ thuộc**: UC-37

---

## Module H - Dịch vụ KH & Đối tác

### UC-39: Tra cứu trạng thái đơn/lô
- **Actor chính**: Merchant, Khách nhận hàng, CSKH

### UC-40: Nhận thông báo mốc trạng thái
- **Actor chính**: Merchant, Khách nhận hàng
- **Phụ thuộc**: UC-39

### UC-41: Tạo và theo dõi khiếu nại
- **Actor chính**: Khách nhận hàng, Merchant, CSKH

### UC-42: Theo dõi ngoại lệ SLA
- **Actor chính**: CSKH, Quản lý kho
- **Phụ thuộc**: UC-41 hoặc UC-32

---

## Module I - Tính phí, COD & Đối soát

### UC-43: Tính phí dịch vụ đơn/lô
- **Actor chính**: Kế toán tài chính
- **Phụ thuộc**: UC-17/UC-31/UC-38 tùy kịch bản.

### UC-44: Đối soát COD
- **Actor chính**: Kế toán tài chính
- **Phụ thuộc**: UC-43

### UC-45: Điều chỉnh tài chính do hoàn trả
- **Actor chính**: Kế toán tài chính
- **Phụ thuộc**: UC-37

### UC-46: Xử lý tranh chấp đối soát
- **Actor chính**: Kế toán tài chính, CSKH
- **Phụ thuộc**: UC-44 hoặc UC-45

---

## Module J - Điều hành KPI

### UC-47: Theo dõi KPI fulfillment
- **Actor chính**: Admin, Quản lý kho

### UC-48: Theo dõi KPI giao hàng
- **Actor chính**: Admin, Điều phối vận tải

### UC-49: Theo dõi KPI tồn kho
- **Actor chính**: Admin, Quản lý kho

### UC-50: Xem dashboard chất lượng dịch vụ
- **Actor chính**: Admin, CSKH, Kế toán
- **Phụ thuộc**: UC-47, UC-48, UC-49

---

## 4) Ma trận phụ thuộc quan trọng (rút gọn)

| Use case sau | Bắt buộc phải có trước |
|---|---|
| UC-03 Xác nhận đơn | UC-01, UC-02 |
| UC-21 Lập sóng/mẻ lấy hàng | UC-15 Giữ chỗ tồn |
| UC-23 Bàn giao chặng cuối | UC-22 Lấy hàng & đóng gói |
| UC-31 Giao thành công | UC-30 Trung chuyển / phân loại |
| UC-34 Tạo RMA | UC-32 Giao thất bại hoặc yêu cầu hoàn |
| UC-37 Xử lý tài chính hoàn trả | UC-36 Quyết định xử lý hàng hoàn |
| UC-44 Đối soát COD | UC-43 Tính phí dịch vụ |
| UC-50 Dashboard dịch vụ | UC-47, UC-48, UC-49 |

---

## 5) Gợi ý dùng tài liệu này

1. Dùng phần UC-01..UC-50 để viết user story cho sprint.
2. Dùng mục phụ thuộc để lập thứ tự triển khai.
3. Dùng actor để tách quyền truy cập theo vai trò.
4. Dùng luồng ngoại lệ để thiết kế test case nghiệp vụ.
