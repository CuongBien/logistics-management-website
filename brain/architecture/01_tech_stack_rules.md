# Tech Stack & Infrastructure Rules

## 3. Techstack Đề Xuất: .NET Centric Ecosystem

Việc thống nhất sử dụng .NET mang lại lợi thế to lớn về việc chia sẻ Codebase (Models, Utilities), dễ dàng luân chuyển nhân sự và tận dụng hiệu năng vượt trội của .NET hiện đại.

### 3.1. Backend & Core Services

- **Ngôn ngữ:** C# (.NET 8/9).
- **Framework:**
  - **ASP.NET Core Web API:** Cho các dịch vụ nghiệp vụ chính (OMS, WMS, Identity).
  - **Worker Services (Background Tasks):** Cho các tác vụ chạy nền như xử lý GPS, đồng bộ dữ liệu, gửi Email/SMS.
- **Internal Communication (Giao tiếp nội bộ):** Sử dụng **gRPC**.
  - Thay thế REST API truyền thống bằng gRPC giúp giảm kích thước gói tin và tăng tốc độ giao tiếp giữa các services lên **5-10 lần** (quan trọng khi TMS cần truy vấn dữ liệu tồn kho từ WMS liên tục).

### 3.2. Event Bus & Messaging

- **Thư viện:** **MassTransit**. Đây là trái tim của kiến trúc Event-Driven trong .NET. Nó giúp trừu tượng hóa các logic phức tạp của Message Broker.
- **Broker:**
  - **Apache Kafka:** Cho luồng dữ liệu lớn như GPS.
  - **RabbitMQ:** Cho luồng nghiệp vụ đơn hàng phức tạp.

### 3.3. Real-time Communication

- **Công nghệ:** **ASP.NET Core SignalR**.
- **Ứng dụng:**
  - Đẩy thông báo đơn mới cho tài xế tức thì (không cần tài xế refresh app).
  - Vẽ lộ trình xe chạy thời gian thực trên bản đồ của Admin (Control Tower).
- **Scale:** Kết hợp với **Redis Backplane** để đảm bảo hoạt động tốt khi có nhiều server cùng chạy.

### 3.4. Database Strategy (Polyglot Persistence)

- **PostgreSQL + PostGIS:**
  - Lưu trữ dữ liệu quan hệ (Master Data).
  - Sử dụng thư viện Npgsql và Entity Framework Core của .NET.
  - **PostGIS** xử lý các truy vấn không gian (Spatial Queries) như: "Tìm kho gần khách hàng nhất".
- **MongoDB (NoSQL):**
  - Lưu trữ Audit Logs, lịch sử thay đổi trạng thái đơn hàng, dữ liệu thô từ cảm biến IoT. Dùng C# Driver chính hãng.
- **Redis:**
  - Caching dữ liệu hay dùng (Bảng giá, Danh sách tỉnh thành).
  - Lưu trữ vị trí xe mới nhất (Last known location) để hiển thị nhanh.

### 3.5. Frontend Ecosystem

- **Web Portal (Admin/Dispatcher):**
  - **Framework:** **React** hoặc **Angular** (Single Page App).
  - **State Management:** Redux Toolkit (React) hoặc NgRx (Angular) để quản lý trạng thái phức tạp realtime.
  - **Component Library:** Ant Design hoặc Material UI.
- **Mobile App (Driver/Warehouse):**
  - **Framework:** **.NET MAUI** (Multi-platform App UI).
  - **Lợi thế:** Tận dụng lại 100% Logic C#, Model, Utilities từ Backend. Dễ dàng maintain bộ code thống nhất cho cả Android/iOS và các thiết bị PDA công nghiệp (Zebra).

## 5. Hạ Tầng & Infrastructure

Dù dùng .NET, chúng ta **tuyệt đối không dùng Windows Server** để tiết kiệm chi phí và tăng hiệu năng.

- **Docker:** Đóng gói các .NET Services thành các **Linux Containers** (Image `mcr.microsoft.com/dotnet/aspnet:8.0-alpine` siêu nhẹ).
- **Kubernetes (K8s):**
  - Quản lý vòng đời ứng dụng.
  - **KEDA (Kubernetes Event-driven Autoscaling):** Đây là vũ khí lợi hại. KEDA có thể tự động tăng số lượng server xử lý đơn hàng khi thấy hàng đợi trong Kafka/RabbitMQ bị ứ đọng, và tự giảm về 0 khi hết việc.
- **CI/CD:** Sử dụng GitLab CI hoặc Azure DevOps để tự động hóa quy trình deploy.
