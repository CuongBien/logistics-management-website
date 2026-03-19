# Bài 11: Cổng Thành Phân Luồng (YARP API Gateway)

Nếu không có API Gateway, Frontend (Web/App) sẽ phải tự nhớ: 
- Muốn tạo đơn hàng thì gọi `http://api-oms.com:5000`
- Muốn xem giỏ hàng thì gọi `http://api-wms.com:5001`
- Muốn xem vận chuyển thì gọi `http://api-tms.com:5002`

Nội cái việc Frontend phải xử lý đống CORS (phên dậu bảo mật tên miền) chéo nhau giữa 3 cái host này là đủ trầm cảm rồi.

**Giải pháp:** Mọi Frontend trên đời chỉ cần nhớ MỘT ĐỊA CHỈ DUY NHẤT: `http://api.logistics.com`. 
Đằng sau cái địa chỉ đó là một anh Gác Cổng (Reverse Proxy) tên là **YARP**.

---

## 🚪 1. YARP Làm Nhiệm Vụ Gì?

**YARP (Yet Another Reverse Proxy)** do Microsoft phát triển riêng cho .NET. Nhiệm vụ của nó:
1. **Routing:** Phân luồng đường đi. Nếu URL có chữ `/oms/` -> Chỉ đường qua máy chủ OMS. Nếu URL có chữ `/wms/` -> Chỉ đường qua máy chủ WMS.
2. **Transform:** Chế biến lại URL. Ví dụ khách gọi `/oms/api/orders`, YARP sẽ ngầm vứt chữ `/oms` đi, chỉ chọc vào OMS bằng `/api/orders`.
3. **Thái Giám (Auth Offloading):** Kiểm tra vé vào cửa (Token JWT) ngay từ cổng. Nếu khách không có vé, VÀ THẺ HẾT HẠN YARP đuổi thẳng cổ, đỡ mất công gọi vào trong backend đằng sau chi cho mệt máy.

---

## ⚙️ 2. Cấu Hình Bằng File JSON (Không Cần Code C# Nhiều)

YARP cực kỳ mạnh vì nó chả cần code C# dài dòng, chỉ cần định nghĩa file `appsettings.json`. Sửa xong lưu lại là cấu hình tự động ăn (Hot-reload) mà không cần tắt đi bật lại Gateway!

**Ví dụ Code - Cách chia luồng trong `appsettings.json` của dự án Gateway:**
```json
{
  "ReverseProxy": {
    "Routes": {
      "oms-route": {
        "ClusterId": "oms-cluster",
        "Match": {
          "Path": "/oms/{**catch-all}" // Bất cứ đường dẫn nào bắt đầu bằng /oms/
        },
        "Transforms": [
          { "PathPattern": "/{**catch-all}" } // Chặt bỏ chữ /oms/ khi gửi vào backend
        ]
      },
      "wms-route": {
        "ClusterId": "wms-cluster",
        "Match": {
          "Path": "/wms/{**catch-all}"
        },
        "Transforms": [
          { "PathPattern": "/{**catch-all}" }
        ]
      }
    },
    "Clusters": {
      "oms-cluster": {
        "Destinations": {
          // Trỏ về đúng địa chỉ của Container Docker OMS
          "destination1": { "Address": "http://lms-oms-api:8080" } 
        }
      },
      "wms-cluster": {
        "Destinations": {
          // Trỏ về Container WMS
          "destination1": { "Address": "http://lms-wms-api:8080" }
        }
      }
    }
  }
}
```

---

## 🛡️ 3. Thêm Lá Chắn Thép (Rate Limiting)

Hệ thống Logistics thường xuyên có tài xế xài App chọc điên cuồng API để xem có đơn mới không (Spam). Ta sẽ cài thêm khóa cổ Rate Limiting ngay tại YARP.

**Setup tại `Program.cs` của API Gateway:**
```csharp
// 1. Thêm gói Yarp
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// 2. Thêm lá chắn Rate Limiting (1 IP chỉ được gọi 100 lần / 1 phút)
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed-policy", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
    });
    
    // Nếu bị chặn, trả ra lỗi HTTP 429 (Too Many Requests)
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();

app.UseRateLimiter(); // Bật lá chắn
app.MapReverseProxy(); // Bật cổng dịch chuyển

app.Run();
```
*(Sau đó ở file `appsettings.json`, bên trong phần `Routes`, khai báo thêm dòng `"RateLimiterPolicy": "fixed-policy"` là xong!)*

✅ **Chốt Bài 11:** 
Bất kì Dev nào làm Web Frontend, App Mobile chỉ việc phang 1 link `http://localhost:5000/oms/api/orders`. Thằng YARP sẽ ở cổng 5000, nhận diện chữ `oms`, hớt bỏ chữ đó đi và bắn lệnh lén lút sang `http://lms-oms-api:8080/api/orders`.

Một công cụ tàng hình vĩ đại! Tiếp theo, chúng ta vọc sâu vào con Database Postgres với Bài toán nan giải nhất của ngành bán hàng: **Bán khống (Bài 12: Thuyết tương đối về Xung đột Dữ liệu)**.
