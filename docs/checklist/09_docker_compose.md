# Bài 9: Docker & Không Gian Đóng Gói

Ở Bài 8, chúng ta đã kết thúc phần Lập trình (Code logic). Từ Phần 3 này trở đi, chúng ta giải quyết bài toán: **Làm sao để hệ thống chạy được trên máy của TẤT CẢ mọi người mà không bị lỗi "Can't connect to Postgres" hay "RabbitMQ not found"?**

Câu thần chú kinh điển của các Dev: *"Ủa, code này chạy ngon trên máy tao mà!"*.
Docker sinh ra để đập nát câu thần chú đó.

---

## 🐳 1. Docker & Bản Chất Của Tính Đồng Nhất

Hãy coi Docker là một bến cảng. Mỗi phần mềm (PostgreSQL, Redis, RabbitMQ) sẽ bị nhốt vào một cái **Thùng Container** riêng biệt.
- **Không rác máy:** Cài Postgres bằng Docker, lúc cần xóa chỉ việc gõ 1 lệnh là sạch bách. Không dính Registry, không lén lút chạy ngầm làm chậm máy tính của ae.
- **Tiêu chuẩn hóa:** Bản Postgres trên máy bạn sẽ là phiên bản `16-alpine` y hệt như bản Postgres trên Server Production.

**Docker Compose:** Là người quản đốc bến cảng. Thay vì bạn phải gõ cục súc 10 câu lệnh để bật 10 cái thùng Container, bạn viết 1 file kịch bản tên là `docker-compose.yml`, Quản Đốc sẽ tự bật toàn bộ lên cho bạn.

---

## 🏗️ 2. Ví dụ Cấu Trúc File `docker-compose.yml` Của Team

Dưới đây là mô hình cơ sở hạ tầng (Database + MQ) tối thiểu mà mọi Dev Logistics phải bật khi bắt đầu code:

```yaml
# Phiên bản Compose
version: '3.8'

services:
  # Thùng 1: Cơ sở dữ liệu Postgres
  postgres:
    image: postgres:16-alpine # Dùng bản alpine cho mỏng nhẹ
    container_name: lms-postgres
    environment:
      POSTGRES_USER: lms_admin
      POSTGRES_PASSWORD: SecretPassword123!
      POSTGRES_DB: lms_master_db
    ports:
      - "5432:5432" # Máy tính của bạn : Bên trong Container
    volumes:
      - pgdata:/var/lib/postgresql/data # Mount volume cực kỳ quan trọng!

  # Thùng 2: Tổng đài RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine # Có chữ management là có sẵn giao diện Web
    container_name: lms-rabbitmq
    ports:
      - "5672:5672"   # Port để MassTransit giao tiếp
      - "15672:15672" # Port để anh em mở trình duyệt lên xem (Web UI)
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
      
  # Thùng 3: Redis chặn Spam
  redis:
    image: redis:7-alpine
    container_name: lms-redis
    ports:
      - "6379:6379"

# Khai báo Volumes để Data không bị mất khi tắt thùng tải đi
volumes:
  pgdata:
```

---

## 💾 3. Những Sai Lầm Bậc Nhất Về Docker

1. **"Tắt Container là mất trắng Database!"**
   - Sai. Nếu bạn nhìn dòng `volumes: - pgdata:/var/lib/...` ở trên. Đó là cách ta nói với Docker: "Hãy tạo một thư mục ảo tên là `pgdata` trên Ổ Cứng thật của con Laptop này, rồi nhét hết dữ liệu DB vào đó". Nhờ vậy, bạn xóa container đi tạo lại, DB vẫn CÒN NGUYÊN.
   
2. **"Connection String Ghi Sai Địa Chỉ Localhost"**
   - Khi Service `OMS` của ae chạy ở **bên trong** một Docker Container khác, cái chữ `localhost` đối với nó trỏ vào chính cái Container của nó, chứ không phải Laptop máy chủ! 
   - Vậy làm sao OMS kết nối với Postgres?
   - **Mạng nội bộ:** Docker tự tạo 1 mạng lưới ảo. OMS muốn gọi Postgres thì thay chữ `localhost` thành chữ `postgres` (Tên của cái Service ở file yaml trên). 
   - Ví dụ: `Server=postgres;Port=5432;Database=...`

---

## ⌨️ 4. Bỏ Túi 3 Lệnh Sống Còn Của Team

Là 1 thành viên của team, bạn cắm mặt vào code, nhưng 3 lệnh này nằm lòng giùm:

**Bật công tắc cả thế giới ngầm (gõ ở thư mục gốc chứa file yaml):**
```bash
docker-compose up -d
```
*(Chữ `-d` là Detached. Nghĩa là khởi động xong thì nhả cái màn hình cmd ra cho tui gõ tiếp).*

**Tắt đi đi ngủ (Nhưng không mất DB):**
```bash
docker-compose down
```

**Tẩy rửa máy tính (Hủy toàn bộ DB để build lại từ con số 0):**
```bash
# Lệnh cực độc, chỉ chạy khi Database nát quá muốn làm lại cuộc đời
docker-compose down -v 
```
*(Chữ `-v` là Volume. Nó sẽ xóa sổ cả cái Ổ cứng ảo `pgdata` ban nãy).*

✅ **Chốt Bài 9:** Docker Compose giải phóng não bộ cho Dev, nó là **Infrastructure AS CODE**. Hạ tầng giờ đây cũng là những dòng chữ code, được commit lên Git bình thường. Ae có máy mới thay vì hì hục set up PostgreSql 16... thì nay chỉ việc gõ `docker-compose up` là nới lỏng dây buộc giày lập trình ngay lập tức. Ở **Bài 10**, anh em sẽ lắp ghép rào chắn đầu tiên: **Hệ thống An Ninh Keycloak (Authorization Center)**.
