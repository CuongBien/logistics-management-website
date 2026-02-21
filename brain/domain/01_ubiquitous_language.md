# Ubiquitous Language (Logistics Domain)

Tài liệu này định nghĩa các thuật ngữ chuẩn (Standard Terminology) được sử dụng xuyên suốt Codebase và Database.
**Quy tắc:** Tên Class, Bảng Database và Tên Biến **BẮT BUỘC** phải tuân thủ cột "Code Mapping".

## 1. Core Entities (Thực thể cốt lõi)

| Term | Vietnamese Definition | Code Mapping |
| :--- | :--- | :--- |
| **Consignor** (Shipper) | Người Gửi / Nhà Bán Hàng (Vendor). Bên chịu trách nhiệm gửi hàng đi. | `Consignor` |
| **Consignee** | Người Nhận / Khách Hàng cuối. Bên nhận kiện hàng thực tế. | `Consignee` |
| **3PL** | Đơn vị vận chuyển thứ 3 (Ví dụ: GHTK, GHN, ViettelPost) thuê ngoài. | `ThirdPartyProvider` |
| **Hub** | Điểm trung chuyển / Kho chia chọn. Nơi hàng hóa chỉ dừng lại để phân loại, không lưu kho lâu dài. | `Hub` |
| **Warehouse** | Kho hàng. Nơi lưu trữ hàng hóa lâu dài, có quản lý nhập/xuất/tồn chi tiết. | `Warehouse` |

## 2. Order & Shipment Distinction (QUAN TRỌNG)

Sự phân biệt sống còn giữa "Đơn hàng mua" và "Đơn hàng vận chuyển":

* **Order (`SalesOrder`):** Đơn hàng thương mại.
    * Đại diện cho "Yêu cầu mua hàng" của khách.
    * Chứa thông tin tài chính: Tổng tiền, Khuyến mãi, Trạng thái thanh toán.
    * *Ví dụ:* Khách mua 1 Tủ lạnh + 1 Cái chảo.

* **Shipment (`Shipment`):** Đơn vị vận chuyển (Gói hàng).
    * Đại diện cho "Vật lý" (thùng hàng) được di chuyển trên đường.
    * Một `Order` có thể bị tách thành nhiều `Shipment` (Ví dụ: Tủ lạnh ở Kho A, Cái chảo ở Kho B -> 2 Shipments).
    * Mỗi Shipment gắn liền với một **WaybillCode** (Mã vận đơn) để tracking.

## 3. Warehouse Terms (Thuật ngữ Kho)

| Term | Vietnamese Definition | Code Mapping |
| :--- | :--- | :--- |
| **SKU** | Mã định danh sản phẩm (Ví dụ: `IPHONE-15-TITAN`). | `Sku` |
| **Bin/Location** | Vị trí lưu kho nhỏ nhất. Thường theo cấu trúc: Zone (Khu) - Aisle (Dãy) - Rack (Kệ) - Shelf (Tầng) - Bin (Hộc). | `BinLocation` |
| **LPN** | License Plate Number. Mã định danh của vật chứa (Pallet, Rổ, Sọt, Thùng carton). Dùng để di chuyển nhiều SKU cùng lúc. | `Lpn` |
| **Wave Picking** | Chiến thuật "Gom đơn nhặt hàng loạt". Hệ thống gom 50 đơn hàng lại, sắp xếp đường đi tối ưu để nhân viên nhặt 1 lần được 50 món. | `PickingWave` |
| **ASN** | Thông báo hàng đến (Advanced Shipping Notice). Dữ liệu nhà cung cấp gửi trước khi xe tải đến nhập kho. | `AsnDocument` |

## 4. Transportation Terms (Thuật ngữ Vận tải)

| Term | Vietnamese Definition | Code Mapping |
| :--- | :--- | :--- |
| **Waybill** | Tờ Vận Đơn (Tem dán trên thùng hàng). Chứa mã vạch, thông tin người nhận. | `Waybill` |
| **Manifest** | Bảng Kê. Danh sách tất cả các Shipments được xếp lên một chuyến xe cụ thể. Tài xế ký nhận dựa trên Manifest. | `Manifest` |
| **COD** | Cash On Delivery. Tiền thu hộ. Số tiền tài xế bắt buộc phải thu từ khách khi giao hàng. | `CodAmount` |
| **POD** | Proof of Delivery. Bằng chứng giao hàng. Bắt buộc phải là **Chữ ký điện tử** hoặc **Hình ảnh chụp tại điểm giao**. | `ProofOfDelivery` |
| **Milk Run** | Tuyến giao hàng vòng tròn. Xe đi từ Kho -> Điểm A -> Điểm B -> Điểm C -> Quay về Kho (để tối ưu không chạy xe rỗng). | `MilkRunRoute` |
| **LM / Last-mile** | Giao hàng chặng cuối. Chặng từ Hub địa phương đến tay khách hàng. | `LastMileDelivery` |
| **Linehaul** | Vận chuyển đường trục. Xe tải lớn chạy giữa các Kho tổng hoặc Hub tỉnh (liên tỉnh). | `LinehaulTrip` |