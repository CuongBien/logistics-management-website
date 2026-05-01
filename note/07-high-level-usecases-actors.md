# High-Level Use Cases + Actors (User Interaction Only)

> Phạm vi: chỉ các use case mà **con người** tương tác trực tiếp với hệ thống.  
> Loại trừ: thiết bị phần cứng, cổng bảo vệ/gate, và các xử lý hệ thống nội bộ không có thao tác người dùng.

## 1) Actors

### External Actors
- **Merchant / Chủ hàng**
- **Khách nhận hàng (Consignee/B2B Customer)**

### Internal Actors
- **Admin / Quản trị hệ thống**
- **Nhân viên điều phối đơn hàng**
- **Nhân viên kho**
- **Quản lý kho**
- **Nhân viên điều phối vận tải**
- **Nhân viên CSKH**
- **Kế toán tài chính**

---

## 2) High-Level Use Cases (Business)

1. Quản lý đơn hàng (tạo/xem/xác nhận/hủy)
2. Lập kế hoạch nhập kho
3. Tiếp nhận và đối soát hàng nhập
4. Cất hàng vào vị trí lưu trữ
5. Quản lý tồn kho và giữ chỗ tồn
6. Lập kế hoạch xuất kho B2C
7. Lập kế hoạch xuất kho B2B
8. Xử lý đóng gói và sẵn sàng giao
9. Bàn giao vận chuyển và cập nhật giao hàng
10. Khởi tạo và xử lý hoàn trả (RMA)
11. Tra cứu trạng thái đơn/giao vận
12. Xử lý khiếu nại & ngoại lệ SLA
13. Tính phí dịch vụ, COD, đối soát
14. Theo dõi KPI vận hành

---

## 3) Mermaid (Actor ↔ Use Case Mapping)

```mermaid
flowchart LR

%% Actors
subgraph A[Actors]
  A1[Merchant / Chủ hàng]
  A2[Khách nhận hàng]
  A3[Admin]
  A4[Nhân viên điều phối đơn hàng]
  A5[Nhân viên kho]
  A6[Quản lý kho]
  A7[Nhân viên điều phối vận tải]
  A8[Nhân viên CSKH]
  A9[Kế toán tài chính]
end

%% Use Cases
subgraph U[High-Level Use Cases]
  U1((Quản lý đơn hàng))
  U2((Lập kế hoạch nhập kho))
  U3((Tiếp nhận & đối soát hàng nhập))
  U4((Cất hàng vào vị trí lưu trữ))
  U5((Quản lý tồn kho & giữ chỗ tồn))
  U6((Lập kế hoạch xuất kho B2C))
  U7((Lập kế hoạch xuất kho B2B))
  U8((Đóng gói & sẵn sàng giao))
  U9((Bàn giao vận chuyển & cập nhật giao hàng))
  U10((Khởi tạo & xử lý hoàn trả RMA))
  U11((Tra cứu trạng thái đơn/giao vận))
  U12((Xử lý khiếu nại & ngoại lệ SLA))
  U13((Tính phí dịch vụ, COD, đối soát))
  U14((Theo dõi KPI vận hành))
end

%% External actor interactions
A1 --> U1
A1 --> U2
A1 --> U11
A1 --> U10

A2 --> U11
A2 --> U10
A2 --> U12

%% Internal actor interactions
A3 --> U14
A3 --> U11

A4 --> U1
A4 --> U6
A4 --> U7
A4 --> U11

A5 --> U3
A5 --> U4
A5 --> U8
A5 --> U10

A6 --> U2
A6 --> U5
A6 --> U14

A7 --> U9
A7 --> U11

A8 --> U11
A8 --> U12
A8 --> U10

A9 --> U13
A9 --> U12
A9 --> U14
```

---

## 4) Notes
- Sơ đồ này thể hiện **tương tác người dùng với hệ thống** ở mức nghiệp vụ cao.
- Không mô tả integration nội bộ giữa các service.
- Không đưa vào actor dạng thiết bị hoặc hạ tầng vật lý.
