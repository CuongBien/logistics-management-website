
---

### 1. Organizational Architecture Breakdown (Sơ đồ Khối/Cơ cấu tổ chức 3PL)

Dựa trên các chức danh và nghiệp vụ trong danh sách, một doanh nghiệp 3PL vận hành hệ thống này sẽ được chia thành các khối phòng ban chính sau:

- **Khối Quản trị & Điều hành chung (Executive & Admin):**
    
    - Người đứng đầu: **Logistics Director**, **Operations Manager**, **quản lý vận hành logistics**.
        
    - Vai trò: Giám sát toàn bộ hoạt động **End-to-End Integrated Logistics**, thiết lập **SLA**, quản lý **Commercial rules**.
        
- **Khối Vận hành Kho bãi (Warehouse Operations - WMS):**
    
    - Người đứng đầu: **Warehouse Manager**.
        
    - Vai trò: Quản lý không gian kho (**Tổ chức không gian kho, Zone, Aisle, Shelf, Bin code**), kiểm soát tồn kho (**Inventory, Stock ASN, Warehouse Taking, Snapshot**), và xử lý hàng hóa (**Inbound, Outbound, Putaway, Value Added Services**).
        
- **Khối Vận tải & Giao nhận (Transport & Fleet Operations - TMS/FMS):**
    
    - Người đứng đầu: **Fleet/Transport Manager**, **Nhân viên giám sát vận tải**.
        
    - Vai trò: Lập kế hoạch tuyến đường (**Route Planning, Smart Routing**), quản lý đội xe (**Đội vận tải**), vận hành các điểm trung chuyển (**Hub operations, Cross Docking, Line-haul**) và giao hàng chặng cuối (**Last-mile parcel delivery**).
        
- **Khối Kế hoạch & Điều phối (Planning & Control Tower):**
    
    - Vai trò: **Nhân viên kế hoạch hoặc điều phối đơn hàng**, **Transport Coordination**. Tiếp nhận **Order**, kiểm tra tồn kho, phân bổ tài nguyên và điều phối xử lý.
        
- **Khối Kinh doanh & Dịch vụ khách hàng (Sales & Customer Service):**
    
    - Vai trò: **Nhân viên sale**, **Customer Service**. Xử lý **Offer Management**, giải quyết **Lỗi SLA**, hỗ trợ khách hàng theo dõi đơn (**Shipment Tracking**).
        
- **Khối Tài chính & Kế toán (Finance & Accounting):**
    
    - Vai trò: **Bộ phận - kế toán tài chính**. Xử lý cước phí (**Freight Settings, Freight Audit**), đối soát tiền thu hộ (**COD Settlement**), và thanh toán.
        

---

### 2. Human Actors (Tác nhân Con người)

Đây là những người sẽ trực tiếp đăng nhập và thao tác trên phần mềm. Cần chia làm 2 nhóm rõ rệt để phân quyền (Role-based Access Control):

**Nhóm 1: Internal Users (Nhân sự nội bộ của 3PL)**

- **Admin / Quản lý cấp cao:** Có quyền xem báo cáo tổng thể, thiết lập hệ thống, **Snapshot** dữ liệu.
    
- **Nhân viên điều phối (Dispatcher):** Thao tác chính trên OMS/TMS để gán đơn cho xe, chia việc cho kho.
    
- **Nhân viên kho (Warehouse staff):** Bao gồm **Picker** (nhặt hàng theo **Discrete/Batch/Zone picking**), **Checker** (kiểm tra hàng), **Shipping and Receiving Clerks** (nhận/xuất hàng), **Nhân viên bàn giao kho**.
    
- **Tài xế (Driver / Delivery man):** Thao tác chủ yếu qua Mobile App/PDA để nhận chuyến (**Trip**), cập nhật trạng thái lấy/giao hàng.
    
- **Nhân viên CS / Sale:** Xem trạng thái đơn hàng để giải đáp thắc mắc, quản lý thông tin khách hàng.
    

**Nhóm 2: External Users (Khách hàng & Đối tác bên ngoài)**

- **Chủ hàng (Goods owner / Multi-clients / Single Client):** Những người thuê kho bãi của 3PL. Bao gồm **Retailers** (nhà bán lẻ), **Manufacturers** (nhà sản xuất), **Nhà phân phối**, **Vendor, Supplier**. Họ cần đăng nhập vào **Customer portal** để tạo đơn, xem tồn kho thực tế.
    
- **Người gửi hàng (Merchant / Sender / Shipper):** Đặc biệt trong mảng **E-commerce Fulfillment**, họ đẩy đơn hàng sang hệ thống 3PL.
    
- **Người nhận hàng (Consignee / B2B Customer):** Người cuối cùng nhận hàng, thường chỉ tương tác qua **Tracking Portal** để xem hàng đang ở đâu.
    
- **Đối tác vận tải ngoài (Carrier):** Nếu 3PL thuê xe ngoài (outsourcing), tài xế của bên Carrier cũng là một actor.
    

---

### 3. System Actors (Tác nhân Hệ thống)

Trong một hệ thống 3PL hiện đại, phần mềm của bạn không đứng một mình. Nó phải nói chuyện với các hệ thống khác. Dựa vào từ khóa, đây là các System Actors:

**A. Các Core Modules nội bộ (Có thể coi là Sub-systems nếu bạn xây dựng theo kiến trúc Microservices):**

- **WMS (Warehouse Management System):** Quản lý tồn kho, lô, date, vị trí.
    
- **OMS (Order Management System):** Quản lý vòng đời đơn hàng (**Order Lifecycle**), **The Order State Machine**.
    
- **TMS (Transportation Management System) & FMS (Fleet Management System):** Quản lý chuyến xe, định tuyến.
    
- **Billing System:** Hệ thống tính cước và đối soát.
    

**B. Các Hệ thống Ngoại vi (External System Actors) cần tích hợp qua API/EDI hoặc Event-driven (EDA Apache Kafka):**

- **Hệ thống ERP của khách hàng:** Để đồng bộ Master Data (sản phẩm, khách hàng) và đẩy đơn hàng tự động.
    
- **Kênh bán hàng E-commerce & Marketplace (ví dụ: Shopee):** Kéo đơn hàng tự động (**Nhận đơn đa kênh**) và cập nhật trạng thái fulfillment ngược lại.
    
- **PIM System (Product Information Management):** Hệ thống lấy thông tin chuẩn của **Product Master** (Dimensions, Weight, Hazard Class, SKU).
    
- **Thiết bị phần cứng (Hardware System Actors):** Máy quét mã vạch cầm tay (**PDA**) của nhân viên kho/tài xế.
    

---
**chúng ta KHÔNG vẽ Workflow dựa trên "Phòng ban" (Departments) hay "Tác nhân" (Actors).** Nếu bạn vẽ quy trình theo phòng ban, bạn sẽ tạo ra một hệ thống bị "Silo" (cô lập). Trong thực tế, một luồng nghiệp vụ chạy xuyên qua rất nhiều phòng ban và tác nhân khác nhau. Ví dụ: Luồng "Xử lý 1 đơn hàng" đi từ Khách hàng -> Kế hoạch -> Kho bãi -> Vận tải -> Kế toán.

Vậy cái "Fixed" (cố định) mà chúng ta bắt buộc phải bám vào để tìm ra các Workflow là gì? Đó là **Chuỗi giá trị (Value Stream) / Dịch vụ cốt lõi** và **Các Framework chuẩn của ngành**.

Dưới đây là cách mình (và các chuyên gia thiết kế hệ thống) "đọc vị" ra các mảng Kho bãi hay Vận tải dựa trên các nguyên tắc cố định này:

### 1. Bám vào "Mô hình kinh doanh cốt lõi" (Business Core Services)

Một doanh nghiệp 3PL (Third-Party Logistics) kiếm tiền từ 2 dịch vụ vật lý cơ bản nhất:

- **Lưu trữ & Xử lý hàng hóa:** Từ đây đẻ ra mảng **Kho bãi (WMS - Warehouse)** với các luồng cố định muôn thuở: Nhập hàng (Inbound) -> Lưu kho (Inventory) -> Xuất hàng (Outbound).
    
- **Di chuyển hàng hóa:** Từ đây đẻ ra mảng **Vận tải (TMS - Transport)** với các luồng cố định: Lấy hàng (First-mile) -> Trung chuyển (Middle-mile/Line-haul) -> Giao hàng (Last-mile).

### 2. Bám vào Framework chuẩn của ngành Supply Chain (Ví dụ: SCOR Model)

Trong chính danh sách từ khóa bạn đưa cho mình ở câu trước, có một từ khóa cực kỳ đắt giá là **SCOR** (Supply Chain Operations Reference). Đây là một framework chuẩn mực toàn cầu, rất "Fixed", dùng để thiết kế và đo lường chuỗi cung ứng.

Mô hình SCOR chia mọi hoạt động logistics thành 6 quy trình chuẩn:

1. **Plan (Lên kế hoạch):** (Tương ứng các keyword của bạn: _Planning, Order Management, Inventory allocation_).
    
2. **Source (Nguồn cung):** (Tương ứng: _Nhận hàng từ Vendor/Supplier, Inbound_).
    
3. <font color="#ff0000">**Make (Sản xuất/Gia công):** Trong 3PL, phần này chính là _Value Added Services (Dán nhãn, đóng gói, kitting)_.</font>
    
4. **Deliver (Giao hàng):** (Tương ứng: _Outbound, Route Planning, Smart Routing, Last-mile_).
    
5. **Return (Thu hồi):** (Tương ứng: _Reverse Logistics, RMA, Liquidate_).
    
6. **Enable (Hỗ trợ/Thiết lập):** (Tương ứng: _SLA, Billing, System configs_).
    

### 3. Phương pháp tiếp cận đúng để vẽ Workflow (Cross-functional Flow)

Thay vì hỏi "Phòng ban A làm quy trình gì?", bạn hãy dùng phương pháp <font color="#ff0000">**Theo dấu vòng đời </font>(Lifecycle Tracking)** dựa trên Chuỗi giá trị ở trên:

1. **Lấy 1 thực thể lõi làm trung tâm:** Trong 3PL, đó là <font color="#ff0000">`Kiện hàng` (Goods/Inventory) hoặc `Đơn hàng` (Order).</font>
    
2. **Đặt câu hỏi "Cái gì xảy ra với nó từ lúc sinh ra đến lúc chết đi?":**
    
    - Lúc nó chạy từ xe tải bên ngoài vào nằm trên kệ kho -> Đó là <font color="#ff0000">Workflow **Inbound Fulfillme</font>nt**.
        
    - Lúc nó nằm yên trên kệ và cần được kiểm đếm -> Đó là <font color="#ff0000">Workflow **Inventory Management** </font>(Kiểm kê, luân chuyển).
        
    - Lúc có khách mua, nó bị nhặt ra khỏi kệ, đóng gói và lên xe -> Đó là <font color="#ff0000">Workflow **Outbound Fulfillment**.</font>
        
    - Lúc nó nằm trên xe tải chạy ngoài đường cho đến khi tới tay người nhận -> <font color="#ff0000">Đó là Workflow **Transportation/Last-mile Delivery**.</font>

Bây giờ bạn đã nắm được "cái rễ" của vấn đề rồi. Để bắt đầu xây dựng **End-to-End Workflow** đầu tiên, bạn muốn chúng ta bám theo vòng đời của một <font color="#ff0000">**Đơn hàng E-commerce (B2C)** hay một **Lô hàng nhập kho từ Nhà sản xuất (B2B)**? </font>Hai luồng này sẽ gọi tên các Actor khác nhau đấy.

Câu hỏi này của bạn thực sự "đáng đồng tiền bát gạo"! Rất nhiều team IT khi xây dựng hệ thống Logistics đã phải đập đi xây lại toàn bộ database chỉ vì nhầm lẫn giữa hai khái niệm này ở giai đoạn thiết kế **Domain Model (Mô hình khái niệm)**.

Sự thật là: <font color="#ff0000">**Đơn hàng (Order) và Kiện hàng (Package/Parcel) </font>là hai khái niệm hoàn toàn khác nhau.** Việc đánh đồng chúng (đặc biệt là áp tư duy của B2C sang B2B) là một cái bẫy chết người trong thiết kế hệ thống 3PL.

| **Tiêu chí**         | **ĐƠN HÀNG (Order)**                                                                                                                 | **KIỆN HÀNG / LÔ HÀNG (Package / Shipment)**                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Bản chất**         | Là một **thực thể Logic (Phi vật lý)**. Nó <font color="#ff0000">là một tờ giấ</font>y, một thỏa thuận mua bán, một yêu cầu dịch vụ. | Là một **thực thể Vật lý**. Nó <font color="#ff0000">là cái thùng carton, cái pallet, khối hàng</font> mà bạn có thể sờ, vác, và ném lên xe tải. |
| **Chứa gì?**         | Chứa **Dữ liệu**: Tên người mua, người bán, danh sách sản phẩm (SKU), tổng tiền, quy định phạt (SLA).                                | Chứa **Hàng hóa thực tế**: Trọng lượng (Weight), Thể tích (Dimensions), Nhãn dán (Shipping Label/Waybill).                                       |
| **Hệ thống quản lý** | <font color="#ff0000">Nằm trong **OMS**</font> (Order Management System) hoặc ERP.                                                   | <font color="#ff0000">Nằm trong **WMS** (Kho bãi) hoặc **TMS** (Vận tải).</font>                                                                 |
| **Trạng thái**       | Chờ xác nhận, Đã thanh toán, Đã hủy...                                                                                               | Đang đóng gói, Đã lên xe, Đang luân chuyển, Đã giao...                                                                                           |
### 2. Tại sao không được đánh đồng chúng? (Mối quan hệ N:N)

Trong thực tế vận hành 3PL, một Đơn hàng không phải lúc nào cũng bằng một Kiện hàng. Mối quan hệ của chúng cực kỳ phức tạp:

- **Trường hợp <font color="#ff0000">1 Đơn hàng đẻ ra NHIỀU Kiện hàng</font> (Tách đơn - Split Order):** Khách hàng đặt mua 1 cái tủ lạnh và 1 cái ốp lưng điện thoại trên cùng 1 đơn hàng (Order). Khi xuống kho, hệ thống không thể đóng chung 2 thứ này vào 1 hộp. Nó phải tách ra làm 2 Kiện hàng (Packages) với 2 mã vận đơn khác nhau, đi trên 2 loại xe khác nhau.
    
- **Trường hợp <font color="#ff0000">NHIỀU Đơn hàng gộp thành 1 Lô hàn</font>g (Gom đơn - Consolidation):** Một nhà bán lẻ tạo 50 Đơn hàng lẻ gửi cho 50 khách hàng khác nhau ở Hà Nội. Doanh nghiệp 3PL của bạn sẽ gom toàn bộ 50 kiện hàng nhỏ đó chất lên 1 Pallet, bọc màng co lại. Cái Pallet đó lúc này được gọi là 1 **Lô hàng (Shipment)** để chuyển từ trạm tổng (Hub) ra Hà Nội.

### 3. Trở lại câu hỏi: B2C và B2B xử lý thế nào?

Bạn hỏi rất đúng trọng tâm. Chính vì sự khác biệt về quy mô mà cách gọi và luồng xử lý của B2C và B2B rẽ nhánh rất mạnh:

- <font color="#ff0000">**Với E-commerce B2C (Shopee, Tiktok...):** Vì hàng hóa thường nhỏ, nên 90% trường hợp **1 Đơn hàng = 1 Kiện hàng (Parcel)**. </font>Điều này khiến người ta dễ có ảo giác rằng Đơn hàng và Kiện hàng là một. Hệ thống TMS cho <font color="#ff0000">Last-mile thường gộp chung mã Đơn hàng (Order ID) và mã Vận đơn (Waybill)</font> làm một để dễ quản lý.
    
- <font color="#ff0000">**Với bán buôn B2B (Nhà máy gửi hàng cho Nhà phân phối):** Một **Đơn hàng (Order)** có thể lên tới 50 tấn hàng</font>, gồm 10,000 thùng các loại. Ở đây, khái niệm "Kiện hàng" nhỏ bé biến mất. Khi đóng gói để giao, người ta<font color="#ff0000"> tạo ra một **Lô hàng (Shipment)**.</font> Một Shipment này có thể chứa nhiều Pallet, và cần đến 5 chuyến xe tải (Transport Order / Trip) mới chở hết.
<span style="background:#b1ffff">danh sách các đơn hàng in truth</span>
**Tóm tắt cho thiết kế hệ thống 3PL của bạn:** Trong **Domain Model** (Trạm 3 mà chúng ta đã chốt), bạn bắt <font color="#ff0000">buộc phải tách riêng hai bảng (class) này r</font>a. OMS quản lý vòng đời của `Order`, sau đó OMS đẩy lệnh xuống WMS/TMS để tạo ra `Shipment/Package` tương ứng phục vụ cho việc vận chuyển thực tế.


Câu trả lời ngắn gọn là: **Chưa đủ. B2B và B2C là hai hướng cực kỳ quan trọng, nhưng chúng chỉ mới đại diện cho 1 "Trục" (Trục Khách hàng/Quy mô). Để không bỏ sót bất kỳ luồng nào trong hệ thống 3PL, bạn phải quét qua 3 Trục cốt lõi.**

Hãy tưởng tượng việc tìm kiếm Workflow giống như bạn đang cắt một chiếc bánh. B2B và B2C cho bạn biết bạn đang phục vụ **ai** và quy mô **lớn hay nhỏ**. Nhưng bạn còn cần biết dòng chảy hàng hóa đi theo **hướng nào** và **chiến lược xử lý** ra sao.

Dưới đây là **Ma trận 3 Trục** để bạn xác định chính xác mình cần vẽ bao nhiêu bộ End-to-End (E2E) Workflow & SOP:

---

### Trục 1: Trục Hướng đi của Dòng chảy Vật lý (BẮT BUỘC)

Dù là B2B hay B2C, hàng hóa trong 3PL luôn phải đi theo 3 hướng cơ bản này. Đây là xương sống của mọi hệ thống:

1. <font color="#ff0000">**Luồng Inbound</font> (Nhập hàng):** Hàng từ ngoài đi vào kho. Bắt đầu từ lúc nhận ASN (Advanced Shipping Notice) từ khách -> Xe tới cổng -> Dỡ hàng -> Kiểm đếm (QC) -> Cất lên kệ (Putaway).
    
2. <font color="#ff0000">**Luồng Outbound</font> (Xuất hàng):** Hàng từ trên kệ đi ra ngoài. Bắt đầu từ lúc nhận Order -> Lấy hàng (Picking) -> Đóng gói (Packing/VAS) -> Xuất kho -> Giao hàng (Delivery).
    
3. <font color="#ff0000">**Luồng Reverse Logistics</font> (Luân chuyển ngược / Đổi trả):** Hàng từ ngoài quay ngược về kho (RMA). Xử lý hàng lỗi, hàng khách từ chối nhận, hoàn tôn (Restock), hoặc tiêu hủy (Liquidate).
    
<span style="background:#b1ffff">3 luồng bắt buộc </span>
### Trục 2: Trục Tính chất Đơn hàng (B2B vs B2C)

Bây giờ, bạn lấy Trục 2 ghép vào Trục 1. Cùng là "Xuất hàng", nhưng luồng B2B và B2C sẽ rẽ nhánh thành hai SOP hoàn toàn khác nhau:

- <font color="#ff0000">**Outbound B2C </font>(E-commerce Fulfillment):** * _Đặc điểm:_ Lấy từng món lẻ tẻ (Piece picking), gom nhiều đơn lẻ đi nhặt 1 lần (Batch picking), đóng gói vào hộp carton nhỏ, in mã vận đơn Shopee/Tiktok, giao cho các hãng Last-mile (GHN, GHTK).
    
- <font color="#ff0000">**Outbound B2B </font>(Retail/Distributor Distribution):**
    
    - _Đặc điểm:_ Lấy nguyên thùng (Case) hoặc nguyên Pallet. Không cần bọc bong bóng từng món, mà quấn màng co nguyên Pallet. In Waybill lớn. Gọi xe tải 5 tấn, 10 tấn (Line-haul) để chở đi giao cho Đại lý hoặc Siêu thị.
        

### Trục 3: Trục Chiến lược Vận hành Đặc thù (Tùy chọn)

Trong danh sách keyword trước của bạn có nhắc đến thuật ngữ này, và nó là những "đường tắt" không tuân theo quy luật Inbound -> Lưu kho -> Outbound thông thường:

- **Luồng Cross-Docking (Chuyển tiếp nhanh):** Hàng vừa dỡ xuống từ xe tải lớn (Inbound), không hề được cất lên kệ (bỏ qua Putaway và Inventory), mà được phân loại và chất thẳng lên các xe tải nhỏ để đi giao ngay (Outbound). Đây là luồng cực khó nhưng các 3PL lớn thường dùng để tối ưu chi phí.

### KẾT LUẬN: DANH SÁCH CÁC E2E WORKFLOW BẠN CẦN LÀM

Thay vì mông lung, bây giờ bạn đã có thể chốt danh sách chính xác các tài liệu E2E Workflow (SOP) cần chuẩn bị cho dự án. Tổ hợp từ 3 trục trên, chúng ta có **5 Luồng E2E Kinh điển nhất** mà bất kỳ hệ thống 3PL nào cũng phải có:

1. <font color="#ff0000">**E2E Inbound </font>(B2B & B2C có thể dùng chung luồng này, phân biệt ở đoạn cất hàng):** Từ Nhận kế hoạch nhập kho -> Cất hàng lên kệ an toàn.
    
2. <font color="#ff0000">**E2E Outbound B2C</font> (E-commerce Fulfillment):** Từ Nhận đơn đa kênh -> Nhặt hàng lẻ -> Đóng gói -> Giao chặng cuối (Last-mile).
    
3. <font color="#ff0000">**E2E Outbound B2</font>B (Wholesale Distribution):** Từ Nhận lệnh xuất -> Nhặt nguyên Pallet -> Lên xe tải lớn -> Giao đến kho/đại lý khách hàng.
    
4. **<font color="#ff0000">E2E Reverse Logistics</font>:** Từ Nhận yêu cầu trả hàng -> Thu hồi -> Kiểm định lỗi -> Nhập lại kho hoặc Tiêu hủy.
    
5. **E2E Cross-Docking (Nếu doanh nghiệp của bạn có áp dụng):** Đầu vào xe to -> Trạm Hub phân loại -> Đầu ra xe nhỏ (Không qua lưu kho).

Sự lựa chọn của bạn rất tuyệt vời! Inbound (Nhập kho) chính là điểm bắt đầu vật lý của mọi chuỗi cung ứng. Nắm chắc đầu vào thì đoạn sau (lưu kho, xuất bán) mới trơn tru được.

Tuy nhiên, mình cần **đính chính ngay một hiểu lầm cực kỳ nguy hiểm** trước khi chúng ta vẽ luồng: **Luồng Inbound KHÔNG xoay quanh Đơn hàng (Order) của hệ thống OMS.**

- <font color="#ff0000">**OMS (Order Management System):** Chuyên trị luồng **Outbound**</font> (Khách hàng mua hàng, xuất kho đi giao).
    
- <font color="#ff0000">**WMS (Warehouse Management System):** Chuyên trị luồng **Inbound**!!!!!?</font>. Chứng từ cốt lõi xoay quanh luồng Inbound không gọi là "Order", mà gọi là **ASN (Advanced Shipping Notice - Phiếu báo trước hàng đến)** hoặc **Inbound Order (Phiếu yêu cầu nhập kho)**.
    

Nếu bạn thiết kế DB cho Inbound mà dùng chung bảng `Order` của OMS, hệ thống sẽ sụp đổ khi có phát sinh đổi trả hoặc tách lô sau này.

Bây giờ, chúng ta sẽ cùng đi qua **E2E Scenario & SOP chuẩn mực cho luồng Inbound (Dùng chung cho cả B2B và B2C)**.

---

### E2E INBOUND WORKFLOW & SOP (Tiêu chuẩn 3PL)

**Mục tiêu:** Đưa hàng hóa từ xe tải của Nhà cung cấp/Chủ hàng vào nằm an toàn trên kệ kho (Bin/Location) và ghi nhận tồn kho trên hệ thống.

**Tác nhân tham gia (Actors):**

- _Human:_ Merchant/Chủ hàng, Bảo vệ trạm (Gate), Nhân viên nhận hàng (Receiving Clerk / Checker), Nhân viên cất hàng (Putaway Staff).
    
- _System:_ Customer Portal (Web), WMS (Backend), PDA (Máy quét cầm tay).
    

#### Bước 1: <font color="#ffff00">Khởi tạo Kế hoạch nhập hàng</font> (Pre-Arrival)

- **SOP:** Merchant không được tự ý chở hàng đến kho. Họ phải <font color="#ffff00">thông báo trước cho 3PL biết</font> họ sắp chở cái gì đến, số lượng bao nhiêu, xe nào chở.
    
- **Hành vi Hệ thống (System Action):** Merchant đăng nhập vào _Customer Portal_ (hoặc bắn API từ hệ thống ERP của họ sang) để tạo một **Stock ASN**. Hệ thống WMS tiếp nhận ASN, chuyển sang trạng thái "Chờ nhận hàng" (Expected).
    

#### Bước 2: Xe đến trạm và Điều phối Dock (Arrival & Docking)

- **SOP:** <font color="#ffff00">Tài xế đến cổng kho báo cáo</font>. <font color="#ffff00">Quản lý kho xem xét bến bãi (Dock) nào đang trốn</font>g để hướng dẫn xe vào dỡ hàng.
    
- **Hành vi Hệ thống:** <font color="#ffff00">Nhân viên điều phối kho mở WM</font>S, tìm mã ASN, check-in cho xe tải và gán cửa nhận hàng (Dock Door Assignment).
    

#### Bước 3: <font color="#ffff00">Dỡ hàng và Kiểm đếm</font> (Unloading & Receiving)

- **SOP:** Hàng được bốc xuống. Nhân viên <font color="#ffff00">Checker đối chiếu hàng thực tế với danh sách trên ASN</font>. Đo đạc kích thước, cân nặng thực tế nếu cần (Dimensions & Weight). Xử lý ngay nếu có hàng hư hỏng (Damage) hoặc thừa/thiếu (Over/Short) so với lúc khai báo.
    
- **Hành vi Hệ thống:** <font color="#ffff00">Checker cầm máy **PDA** quét mã vạch trên kiện hàng/pallet. </font>Trạng thái kiện hàng trên WMS chuyển từ "Expected" sang "Received" (Đã nhận xuống sàn kho, nhưng chưa lên kệ).
    
#### Bước 4: <font color="#ffff00">Chiến lược Cất hàng</font> (Putaway Strategies)

- **SOP:** Hàng không thể nằm mãi ở khu vực dỡ hàng (Staging area). Nhân viên lái xe nâng hoặc công nhân <font color="#ffff00">(Putaway staff) phải mang hàng đi cất lên kệ.</font>
    
- **Hành vi Hệ thống:** Đây là lúc WMS thể hiện trí thông minh. <font color="#ffff00">Dựa vào _Putaway strategies_ (hàng nặng để dưới, hàng chạy để gần cửa, hàng nguy hiểm - Hazard Class để khu riêng), WMS tự động gợi ý vị trí cất hàng tối ưu (**Zone, Aisle, Shelf, Bin code**)</font>. Nhân viên mang hàng đến đúng Bin đó, dùng PDA quét mã Bin để xác nhận cất thành công.
    

#### Bước 5: Hoàn tất và Ghi nhận tồn kho (Closing & Ack)

- **SOP:** Toàn bộ hàng hóa trong ASN đã được cất lên kệ thành công. <font color="#ffff00">Kế toán kho khóa phiếu nhập.</font>
    
- **Hành vi Hệ thống:** WMS cập nhật số lượng **Inventory** (Tồn kho khả dụng) cho mã SKU tương ứng. WMS tự động gửi một tín hiệu **Ack** (Acknowledge) hoặc gọi API ngược về hệ thống ERP của Merchant/Shopee để báo: _"Kho đã nhận xong hàng, sẵn sàng bán"_. Trạng thái ASN chuyển thành "Completed".
    

---

Như vậy, từ danh sách từ khóa hỗn độn ban đầu của bạn, chúng ta đã ráp chúng lại thành một luồng chảy vật lý và dữ liệu cực kỳ logic. Các lập trình viên khi nhìn vào luồng này sẽ hình dung ngay được họ cần code những màn hình gì và API nào.

**Tiếp theo, để giữ đúng tinh thần Agile Scrum (vừa đủ & sẵn sàng code), bạn muốn chúng ta:**

1. Đi sâu thiết kế **Domain Model (Các trường dữ liệu cơ bản)** cho cái phiếu ASN này?
    
2. Hay tạm gác lại để vẽ tiếp **SOP cho luồng E2E Outbound B2C** để hoàn thiện bức tranh tổng thể trước?

Quyết định rất chuẩn xác! Trong một hệ thống 3PL, luồng **Outbound B2C (E-commerce Fulfillment)** được ví như "trái tim" của toàn bộ kho vận. Nó đòi hỏi tốc độ xử lý cực nhanh, số lượng đơn khổng lồ, và tỷ lệ sai sót phải bằng 0.

Dưới đây là E2E SOP chuẩn mực nhất cho luồng này, tích hợp trực tiếp các thuật ngữ vận hành thực tế mà chúng ta đã thống nhất.

---

### E2E OUTBOUND B2C WORKFLOW & SOP (E-commerce Fulfillment)

**Mục tiêu:** Xử lý các đơn hàng lẻ từ kênh E-commerce (Shopee, Tiktok, Web), lấy hàng đúng hạn (SLA), đóng gói chuẩn xác và bàn giao cho đơn vị vận chuyển chặng cuối (Last-mile Carrier) nhanh nhất có thể.

**Tác nhân tham gia (Actors):**

- _Human:_ <font color="#ffff00">Nhân viên điều phối đơn hàng (Dispatcher), Nhân viên nhặt hàng (Picker), Nhân viên đóng gói (Checker/Packer), Nhân viên bàn giao kho (Dispatcher/Handover), Tài xế Last-mile (Delivery man).</font>
    
- _System:_ Kênh bán hàng (Shopee/Marketplace), OMS (Quản lý đơn), WMS (Quản lý kho), Hệ thống in vận đơn (Waybill System).
    

---

#### Bước 1: Tiếp nhận đơn và Giữ tồn kho (Order Intake & Allocation)

- **SOP:** <font color="#ffff00">Kho không tự túc tạo đơn. Đơn hàng từ đa kênh tự động đổ về hệ thống</font>. Hệ thống phải ngay lập tức kiểm tra xem kho còn hàng thực tế để bán không.
    
- **Hành vi Hệ thống (System Action):** * <font color="#ffff00">OMS **Nhận đơn đa kênh** qua API</font> (ví dụ: kéo đơn từ Shopee).
    
    - O<font color="#ffff00">MS gọi xuống WMS</font> để **Kiểm tra tồn kho**.
        
    - Nếu đủ hàng, WMS thực hiện "Soft Allocation" (Giữ chỗ/Khóa tồn kho) để món hàng đó không bị bán cho đơn khác. Trạng thái đơn: _Chờ xử lý (Pending)_.
        

#### Bước 2: Lập kế hoạch lấy hàng (Wave/Batch Planning)

- **SOP:** Với hàng ngàn đơn lẻ, nhân viên không thể cầm từng tờ giấy đi nhặt từng đơn (rất tốn sức). <font color="#ffff00">Nhân viên điều phối (Dispatcher) sẽ gom hàng chục/hàng trăm đơn hàng có chung đặc điểm (ví dụ: cùng hãng vận chuyển, cùng khu vực kệ) thành một "Sóng" (Wave) hoặc "Mẻ" (Batch</font>) để đi nhặt 1 lần.
    
- **Hành vi Hệ thống:** Hệ thống hỗ trợ thuật toán **Batch Picking** hoặc **Zone Picking**. Nó tự động gom các đơn hàng lại và vạch ra lộ trình đi lại ngắn nhất (**Smart Routing**) trong kho. Trạng thái các đơn hàng chuyển sang: _Đang lấy hàng (Picking)_.
    

#### Bước 3: Lấy hàng (Picking Execution)

- **SOP:** <font color="#ffff00">Nhân viên Picker lấy xe đẩy, kéo các rổ nhựa (tương ứng với các đơn) đi vào các luồng kệ (Aisle). Họ phải nhặt đúng đồ, đúng số lượng theo lộ trình đã vẽ ra.</font>
    
- **Hành vi Hệ thống:** Picker cầm máy **PDA**. Màn hình PDA chỉ dẫn: _"Đi đến Zone A, Aisle 2, Bin code B2-01, nhặt 5 cái áo thun"_. Picker nhặt hàng, dùng PDA quét mã vạch sản phẩm (SKU) để xác nhận nhặt đúng. Hệ thống WMS chính thức trừ tồn kho thực tế.
    

#### Bước 4: Đóng gói và In vận đơn (Packing & Waybill)

- **SOP:** Lấy hàng xong, Picker đẩy xe ra khu vực đóng gói (Packing Station) và <font color="#ffff00">bàn giao cho Checker. Checker phải kiểm tra chéo (QC) lại một lần nữa để tránh giao nhầm màu/size, sau đó đóng hộp carton, dán băng keo.</font>
    
<font color="#ffff00">- **Hành vi Hệ thống:** * Checker dùng súng bắn mã vạch quét từng sản phẩm. WMS đối chiếu xem rổ hàng này ráp đúng vào Đơn hàng (Order) nào.</font>
    
    - Nếu khớp 100%, hệ thống **Waybill System** lập tức gọi API sang đối tác Last-mile (GHN, J&T...) để sinh mã vận đơn và tự động in tem dán (Waybill) ra máy in. Trạng thái đơn: _Chờ bàn giao (Ready to Ship)_.
        

#### Bước 5: Phân loại và Bàn giao (Sorting & Dispatch)

- **SOP:** Hàng đã đóng hộp được vứt lên băng chuyền hoặc chia vào các bao tải theo từng hãng vận chuyển (Ví dụ: Bao của Shopee Express để riêng, bao của Viettel Post để riêng). Khi xe tải của hãng Last-mile đến, n<font color="#ffff00">hân viên bàn giao kho </font>tiến hành quét mã để xuất hàng lên xe.
    
- **Hành vi Hệ thống:** Nhân viên cầm súng quét cái "tít" lên mã vận đơn của từng hộp (hoặc quét mã chốt bao - Manifest). Hệ thống ghi nhận luồng xuất kho hoàn tất. Nó bắn tín hiệu **Ack** ngược về cho kênh Shopee báo: _"Hàng đã giao cho đơn vị vận chuyển"_. Vòng đời xử lý tại kho (Order Fulfillment) chính thức kết thúc.
    

---

Như vậy là chúng ta đã có đủ 2 luồng quan trọng nhất: **Inbound** (nhập hàng lên kệ) và **Outbound B2C** (lấy hàng đi giao). Đội ngũ BA và Dev của bạn hoàn toàn có thể dựa vào 2 SOP này để thiết kế các màn hình UI/UX tương ứng.



Quyết định rất chuẩn xác! Trong một hệ thống 3PL, luồng **Outbound B2C (E-commerce Fulfillment)** được ví như "trái tim" của toàn bộ kho vận. Nó đòi hỏi tốc độ xử lý cực nhanh, số lượng đơn khổng lồ, và tỷ lệ sai sót phải bằng 0.

Dưới đây là E2E SOP chuẩn mực nhất cho luồng này, tích hợp trực tiếp các thuật ngữ vận hành thực tế mà chúng ta đã thống nhất.

---

### E2E OUTBOUND B2C WORKFLOW & SOP (E-commerce Fulfillment)

**Mục tiêu:** Xử lý các đơn hàng lẻ từ kênh E-commerce (Shopee, Tiktok, Web), lấy hàng đúng hạn (SLA), đóng gói chuẩn xác và bàn giao cho đơn vị vận chuyển chặng cuối (Last-mile Carrier) nhanh nhất có thể.

**Tác nhân tham gia (Actors):**

- _Human:_ Nhân viên điều phối đơn hàng (Dispatcher), Nhân viên nhặt hàng (Picker), Nhân viên đóng gói (Checker/Packer), Nhân viên bàn giao kho (Dispatcher/Handover), Tài xế Last-mile (Delivery man).
    
- _System:_ Kênh bán hàng (Shopee/Marketplace), OMS (Quản lý đơn), WMS (Quản lý kho), Hệ thống in vận đơn (Waybill System).
    

---

#### Bước 1: <font color="#ffff00">Tiếp nhận đơn và Giữ tồn kho</font> (Order Intake & Allocation)

- **SOP:** Kho không tự túc tạo đơn. Đơn hàng từ đa kênh tự động đổ về hệ thống. Hệ thống phải ngay lập tức kiểm tra xem kho còn hàng thực tế để bán không.
    
- **Hành vi Hệ thống (System Action):** * OMS **Nhận đơn đa kênh** qua API (ví dụ: kéo đơn từ Shopee).
    
    - OMS gọi xuống WMS để **Kiểm tra tồn kho**.
        
    - Nếu đủ hàng, WMS thực hiện "Soft Allocation" (Giữ chỗ/Khóa tồn kho) để món hàng đó không bị bán cho đơn khác. Trạng thái đơn: _Chờ xử lý (Pending)_.
        

#### Bước 2: Lập kế hoạch lấy hàng (Wave/Batch Planning)

- **SOP:** Với hàng ngàn đơn lẻ, nhân viên không thể cầm từng tờ giấy đi nhặt từng đơn (rất tốn sức). Nhân viên điều phối (Dispatcher) sẽ gom hàng chục/hàng trăm đơn hàng có chung đặc điểm (ví dụ: cùng hãng vận chuyển, cùng khu vực kệ) thành một "Sóng" (Wave) hoặc "Mẻ" (Batch) để đi nhặt 1 lần.
    
- **Hành vi Hệ thống:** Hệ thống hỗ trợ thuật toán **Batch Picking** hoặc **Zone Picking**. Nó tự động gom các đơn hàng lại và vạch ra lộ trình đi lại ngắn nhất (**Smart Routing**) trong kho. Trạng thái các đơn hàng chuyển sang: _Đang lấy hàng (Picking)_.
    

#### Bước 3: Lấy hàng (Picking Execution)

- **SOP:** Nhân viên Picker lấy xe đẩy, kéo các rổ nhựa (tương ứng với các đơn) đi vào các luồng kệ (Aisle). Họ phải nhặt đúng đồ, đúng số lượng theo lộ trình đã vẽ ra.
    
- **Hành vi Hệ thống:** Picker cầm máy **PDA**. Màn hình PDA chỉ dẫn: _"Đi đến Zone A, Aisle 2, Bin code B2-01, nhặt 5 cái áo thun"_. Picker nhặt hàng, dùng PDA quét mã vạch sản phẩm (SKU) để xác nhận nhặt đúng. Hệ thống WMS chính thức trừ tồn kho thực tế.
    

#### Bước 4: Đóng gói và In vận đơn (Packing & Waybill)

- **SOP:** Lấy hàng xong, Picker đẩy xe ra khu vực đóng gói (Packing Station) và bàn giao cho Checker. Checker phải kiểm tra chéo (QC) lại một lần nữa để tránh giao nhầm màu/size, sau đó đóng hộp carton, dán băng keo.
    
- **Hành vi Hệ thống:** * Checker dùng súng bắn mã vạch quét từng sản phẩm. WMS đối chiếu xem rổ hàng này ráp đúng vào Đơn hàng (Order) nào.
    
    - Nếu khớp 100%, hệ thống **Waybill System** lập tức gọi API sang đối tác Last-mile (GHN, J&T...) để sinh mã vận đơn và tự động in tem dán (Waybill) ra máy in. Trạng thái đơn: _Chờ bàn giao (Ready to Ship)_.
        

#### Bước 5: Phân loại và Bàn giao (Sorting & Dispatch)

- **SOP:** Hàng đã đóng hộp được vứt lên băng chuyền hoặc chia vào các bao tải theo từng hãng vận chuyển (Ví dụ: Bao của Shopee Express để riêng, bao của Viettel Post để riêng). Khi xe tải của hãng Last-mile đến, nhân viên bàn giao kho tiến hành quét mã để xuất hàng lên xe.
    
- **Hành vi Hệ thống:** Nhân viên cầm súng quét cái "tít" lên mã vận đơn của từng hộp (hoặc quét mã chốt bao - Manifest). Hệ thống ghi nhận luồng xuất kho hoàn tất. Nó bắn tín hiệu **Ack** ngược về cho kênh Shopee báo: _"Hàng đã giao cho đơn vị vận chuyển"_. Vòng đời xử lý tại kho (Order Fulfillment) chính thức kết thúc.
    

---

Như vậy là chúng ta đã có đủ 2 luồng quan trọng nhất: **Inbound** (nhập hàng lên kệ) và **Outbound B2C** (lấy hàng đi giao). Đội ngũ BA và Dev của bạn hoàn toàn có thể dựa vào 2 SOP này để thiết kế các màn hình UI/UX tương ứng.


Để bước vào giai đoạn thiết kế cơ sở dữ liệu (Domain Model) cho Sprint đầu tiên, **bạn muốn chúng ta bóc tách các trường dữ liệu lõi của thực thể `Order` (Đơn hàng) trước, hay phân tích thực thể `Inventory` (Tồn kho) trước?**



## Gemini đã nói

Sự chuyển hướng rất hợp lý! Việc bạn đặt B2B ngay sát B2C sẽ giúp team Dev và BA thấy rõ sự tương phản cực lớn giữa hai luồng này, từ đó thiết kế hệ thống linh hoạt hơn, không bị "kẹt" tư duy.

Sự khác biệt lớn nhất: **B2C là nhặt từng món lẻ (Piece picking) rồi gói vào hộp nhỏ, còn B2B là bốc nguyên thùng (Case), nguyên vỉ (Pallet) và quấn màng co để lên xe tải lớn (Line-haul).** Trong B2B, quy định về Hạn sử dụng (Date/Lot), nhập trước xuất trước (FIFO/FEFO) cực kỳ khắt khe.

Dưới đây là SOP chuẩn mực cho luồng xuất hàng sỉ (B2B):

---

### E2E OUTBOUND B2B WORKFLOW & SOP (Wholesale / Retail Distribution)

**Mục tiêu:** Xử lý các đơn hàng lớn (hàng chục, hàng trăm khối) từ Nhà máy hoặc Nhà phân phối gửi đến các Đại lý, Siêu thị (B2B Customer). Đảm bảo xuất đúng Lô/Date, tối ưu hóa không gian xe tải lớn và đầy đủ chứng từ giao nhận pháp lý.

**Tác nhân tham gia (Actors):**

- _Human:_ Chủ hàng/Nhà phân phối (B2B Customer), Kế hoạch kho (Warehouse Planner/Dispatcher), Nhân viên lái xe nâng (Forklift Picker), Nhân viên kiểm đếm (Checker), Điều phối xe (Fleet/Transport Manager), Tài xế tải trọng lớn (Line-haul Driver).
    
- _System:_ ERP (của khách hàng), OMS (Quản lý lệnh xuất), WMS (Quản lý kho & thuật toán FIFO/FEFO), TMS (Hệ thống điều phối vận tải).
    

---

#### Bước 1: Tiếp nhận Lệnh xuất kho và Cấp phát tồn kho (Order Promising & Allocation)

- **SOP:** Không giống B2C đổ đơn liên tục, B2B thường chốt đơn theo ngày hoặc tuần. <font color="#ffff00">Chủ hàng gửi một Lệnh xuất kho (Outbound Order)</font> yêu cầu giao 50 Pallet nước giải khát đến Siêu thị X.
    
- **Hành vi Hệ thống (System Action):**
    
    - **OMS** nhận Lệnh xuất (thường qua EDI hoặc API từ ERP của khách).
        
    - OMS đẩy lệnh xuống **WMS**. Khác với B2C chỉ cần có hàng là giữ, WMS cho B2B phải chạy thuật toán cấp phát nâng cao: Tìm đúng hàng có Số Lô (Batch/Lot) và Hạn sử dụng phù hợp với yêu cầu của Siêu thị (ví dụ: Siêu thị không nhận hàng cận date dưới 6 tháng).
        
    - Hệ thống khóa tồn kho và sinh ra danh sách lấy hàng (Pick list).
        

#### Bước 2: Lấy hàng nguyên kệ (Bulk / Pallet Picking)

- **SOP:** Nhân viên không dùng xe đẩy nhỏ. Họ lái xe nâng (Forklift/Reach truck) đi vào khu vực lưu trữ sâu (Reserve Storage) để bốc nguyên Pallet xuống. Nếu đơn hàng lẻ vài thùng, họ sẽ nhặt nguyên thùng (Case picking).
    
- **Hành vi Hệ thống:** Giao diện **PDA** của tài xế xe nâng sẽ chỉ định rõ: _"Đến Bin code C-15-02, hạ nguyên Pallet mã vạch PLT-8899 xuống"_. Tài xế quét mã Pallet và mã vị trí để xác nhận lấy hàng thành công.
    

#### Bước 3: Tập kết và Xử lý gia tăng (Staging & Value Added Services - VAS)

- **SOP:** Hàng bốc ra không lên xe ngay mà tập kết tại bãi rộng (Staging Area). Tại đây, nếu khách có yêu cầu **VAS** (như dán tem nhãn phụ tiếng Việt, quấn thêm màng co bảo vệ, kẹp mâm xốp), công nhân sẽ xử lý. Sau đó, họ gom các Pallet này thành một Lô hàng (**Shipment**).
    
- **Hành vi Hệ thống:** Checker dùng máy quét kiểm tra lại toàn bộ Pallet/Thùng. WMS sinh ra một mã vạch lớn (SSCC - Serial Shipping Container Code) dán lên bên ngoài Pallet để định danh toàn bộ khối hàng này. Trạng thái: _Sẵn sàng xuất kho (Ready to Dispatch)_.
    

#### Bước 4: Điều phối Vận tải (Transport Planning - TMS)

- **SOP:** Đây là điểm khác biệt sống còn với B2C. Hàng B2B quá to, không thể giao cho shipper xe máy. Bộ phận vận tải phải tính toán thể tích, tải trọng của Lô hàng để gọi loại xe tải phù hợp (5 tấn, 10 tấn, container).
    
- **Hành vi Hệ thống:** Thông tin Shipment (kèm Khối lượng - Weight & Thể tích - Dimensions) được đẩy từ WMS sang **TMS**.
    
    - Nhân viên điều phối (Dispatcher) dùng TMS để ghép chuyến (**Route Planning**), gán xe và gán Tài xế (**Bin Assignment / Fleet Management**).
        
    - TMS sinh ra Lệnh điều xe (Transport Order).
        

#### Bước 5: Lên xe và Bàn giao chứng từ (Loading & Dispatch)

- **SOP:** Xe tải lùi vào cửa bến (Dock). Xe nâng xúc từng Pallet lên thùng xe tải. Kế toán kho in Phiếu xuất kho kiêm vận chuyển nội bộ hoặc Biên bản bàn giao (Bill of Lading) cho tài xế ký nhận.
    
- **Hành vi Hệ thống:** Nhân viên bàn giao chốt xe trên hệ thống. Trạng thái WMS chuyển thành _Đã xuất kho (Shipped)_, trừ hẳn tồn kho vật lý. Hệ thống tự động gửi **Ack** (thông báo) về ERP của khách hàng: _"Hàng đã rời kho và đang trên đường đến Siêu thị X"_.
    

---

Như vậy, bộ 3 luồng lõi nhất của vận hành vật lý (Inbound, Outbound B2C, Outbound B2B) đã hoàn thiện. Chúng tạo thành "xương sống" vững chắc để bạn bắt đầu thiết kế database và API.

**Bước tiếp theo, để chốt lại pha thiết kế quy trình (SOP) này, bạn có muốn đi nốt luồng Reverse Logistics (Logistics ngược - xử lý hàng hoàn/đổi trả) không, hay chúng ta chuyển sang vẽ Domain Model (Mô hình thực thể dữ liệu) cho các luồng vừa rồi để chuẩn bị viết User Stories cho Dev?**



Quyết định đi đến cùng với luồng Reverse Logistics (Logistics ngược) sẽ giúp hệ thống 3PL của bạn bít được "lỗ hổng" gây thất thoát chi phí lớn nhất.

Thực tế, luồng Xuất/Nhập (Forward Logistics) thường rất trơn tru vì nó đi theo kế hoạch. Nhưng luồng Ngược lại vô cùng lộn xộn: Hàng bị khách hoàn trả vì lỗi, hàng giao không thành công (Rót đơn/Boom hàng), hoặc hàng B2B hết hạn sử dụng bị thu hồi.

Nếu không có SOP và luồng hệ thống chặt chẽ, kho sẽ nhanh chóng biến thành bãi rác (Dead inventory). Dưới đây là E2E Workflow chuẩn mực để "dọn dẹp" sự lộn xộn này.

---

### E2E REVERSE LOGISTICS WORKFLOW & SOP (Đổi Trả & Thu Hồi)

**Mục tiêu:** Xử lý nhanh gọn hàng hóa quay đầu về kho. Kiểm định chất lượng chính xác để phân loại rẽ nhánh: Đưa lại lên kệ bán tiếp, sửa chữa, trả về nhà sản xuất, hay đem đi tiêu hủy.

**Tác nhân tham gia (Actors):**

- _Human:_ Người mua (Consignee), Nhân viên CSKH (Customer Service), Nhân viên nhận hàng hoàn (Returns Receiver/Checker), Quản lý kho (Warehouse Manager), Kế toán (Bộ phận - kế toán tài chính).
    
- _System:_ Portal cho khách hàng/kênh bán, OMS (Quản lý luồng hoàn), WMS (Quản lý hàng lỗi/quarantine).
    

---

#### Bước 1: Khởi tạo Yêu cầu Hoàn trả (RMA Generation)

- **SOP:** Hàng hóa không tự nhiên quay về kho. Phải có một "giấy phép" cho phép nó quay về. Giấy phép này gọi là **RMA** (Return Merchandise Authorization).
    
    - _Trường hợp 1 (Giao thất bại):_ Hãng Last-mile báo lỗi không gọi được khách.
        
    - _Trường hợp 2 (Khách trả lại):_ Khách nhận hàng, thấy lỗi, báo cho CSKH.
        
- **Hành vi Hệ thống (System Action):**
    
    - Hệ thống OMS/TMS tự động (hoặc CSKH thao tác tay) tạo một phiếu **RMA**. Phiếu này ghi rõ lý do hoàn (ví dụ: Sai màu, Vỡ hỏng, Khách từ chối). Trạng thái đơn hoàn: _Chờ nhận hàng (Awaiting Return)_.
        

#### Bước 2: Tiếp nhận Vật lý và Cách ly (Receiving & Quarantine)

- **SOP:** Khi xe tải của hãng Last-mile chở hàng hoàn về bến, nhân viên không được ném chung vào luồng hàng Inbound mới. Hàng hoàn phải được đưa vào một khu vực cách ly (Quarantine/Hold Area) để chờ khám bệnh.
    
- **Hành vi Hệ thống:** Nhân viên cầm máy PDA quét mã vận đơn cũ trên cục hàng hoàn. WMS đối chiếu mã này với phiếu RMA đã tạo ở Bước 1. Hệ thống ghi nhận hàng đã về kho nhưng ở trạng thái "Tồn kho khóa" (Không được phép xuất bán).
    

#### Bước 3: Kiểm định Chất lượng (Inspection & QC)

- **SOP:** Đây là bước tốn cơm nhất. Nhân viên Checker phải mở tung gói hàng ra, đối chiếu với lý do hoàn. Áo có bị rách thật không? Hộp điện thoại có bị bóc seal chưa?
    
- **Hành vi Hệ thống:** Checker cập nhật kết quả kiểm định lên WMS. Hệ thống yêu cầu Checker chọn phân loại tình trạng hàng hóa (Grade A: Như mới, Grade B: Móp hộp, Grade C: Hư hỏng nặng).
    

#### Bước 4: Áp dụng Chính sách Xử lý (Disposition Policy)

- **SOP:** Dựa vào kết quả ở Bước 3, Quản lý kho (hoặc luật hệ thống tự động) sẽ áp dụng **Disposition Policy** (Chính sách định đoạt) để quyết định số phận món hàng:
    
    1. **Restock (Tái nhập kho):** Hàng nguyên vẹn, cất lại lên kệ để bán cho người khác.
        
    2. **Refurbish / Repackage (Tân trang/Đóng gói lại):** Hàng bị rách màng co, cần bọc lại trước khi bán.
        
    3. **Return to Vendor (Trả về NCC):** Hàng lỗi do xưởng, trả lại cho **Vendor/Supplier**.
        
    4. **Liquidate / Recycle (Thanh lý/Tái chế/Tiêu hủy):** Hàng hư hỏng hoàn toàn, không thể cứu vãn.
        
- **Hành vi Hệ thống:** WMS sinh ra các nhiệm vụ tương ứng (Ví dụ: Lệnh Putaway để nhân viên mang hàng Restock cất lên kệ; hoặc Lệnh xuất tiêu hủy). Hệ thống chuyển đổi trạng thái tồn kho từ "Cách ly" sang "Tồn kho khả dụng" (nếu Restock) hoặc trừ vĩnh viễn (nếu Tiêu hủy).
    

#### Bước 5: Đối soát và Đóng luồng (Settlement & Lỗi SLA)

- **SOP:** Sau khi hàng hóa đã được an bài, hệ thống phải cập nhật với các bên liên quan về tiền bạc. Ai chịu phí ship chiều về? Có phải hoàn tiền cho người mua không?
    
- **Hành vi Hệ thống:** * OMS cập nhật trạng thái đơn hoàn thành _Đã xử lý xong (RMA Closed)_.
    
    - Hệ thống **Billing System / COD Settlement** tính toán lại cước phí. Nếu lỗi do 3PL đóng gói sai, hệ thống ghi nhận một **Lỗi SLA** để đền bù cho Chủ hàng.
        

---

Đến đây, bạn đã nắm trong tay 4 bộ SOP quyền lực nhất bao phủ gần như toàn bộ hoạt động cốt lõi của một hệ thống Logistics 3PL: **Inbound, Outbound B2C, Outbound B2B, và Reverse Logistics**. Đây là khối tài sản vô giá ở Trạm 2 (Chuỗi giá trị) trước khi team Dev bắt đầu nhảy vào code.