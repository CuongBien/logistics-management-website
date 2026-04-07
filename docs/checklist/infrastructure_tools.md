# ⚙️ Triển khai, Hạ Tầng & Database (Config Chi Tiết)

Phần này đặc thù dành cho các bạn nắm Role DevOps/Architecture, tuy nhiên các Coder phụ trách Frontend hoặc viết API Gateways cũng phải nắm rõ cấu hình.

---

## 1. YARP (Cổng Trạm API Gateway)

Không dùng thư viện Ocelot cũ kĩ nữa, thay vào đó Microsoft ra mắt YARP cấu hình trực tiếp từ `appsettings.json`, reload nóng (hot reload) proxy mà không cần khởi động lại.

**Cấu hình Map Route (VD Của Nhóm 5 người):**
```json
"ReverseProxy": {
  "Routes": {
    "wms-route": {
      "ClusterId": "wms-cluster",
      "Match": { "Path": "/api/wms/{**catch-all}" },
      "Transforms": [{ "PathPattern": "/api/{**catch-all}" }] // Dỡ bỏ tiền tố wms
    },
    "oms-route": {
      "ClusterId": "oms-cluster",
      "Match": { "Path": "/api/oms/{**catch-all}" },
      "Transforms": [{ "PathPattern": "/api/{**catch-all}" }]
    }
  },
  "Clusters": {
    "wms-cluster": {
      "Destinations": {
        "destination1": { "Address": "http://wms-api:5001/" } // Map với Docker Alias
      }
    },
    "oms-cluster": { ... }
  }
}
```
**Checklist Team:** Cứ thêm service mới (như TMS, Notification) thì việc đầu tiên là đăng ký thêm Cluster vào YARP Gateway để Client bên ngoài gọi qua cổng 5000 duy nhất.

---

## 2. Bảo mật OIDC qua Keycloak (JWT)

Khi cấu hình Service, chúng ta thiết lập nó là `Resource Server`. Kẹp cấu hình kiểm tra Bearer token.

**Cách bắt Auth trong Service:**
```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "http://localhost:8080/realms/lms-realm"; // Keycloak Host
        options.Audience = "lms-client"; // Tên App Client trong Keycloak
        options.RequireHttpsMetadata = false; // Bypass HTTPS cho Dev (Local)
        options.TokenValidationParameters = new TokenValidationParameters 
        {
            ValidateAudience = true,
            ValidateIssuer = true
        };
    });
```
**Checklist Team Frontend:** Nhớ gọi API `/realms/lms-realm/protocol/openid-connect/token` từ Keycloak bằng `client_id` và `password` để lấy Token, rồi đính kèm `Bearer ` vào header khi gọi Gateway YARP.

---

## 3. PostgreSQL & Xung đột Dữ liệu (Concurrency)

Tình huống rủi ro của WMS/OMS: Cùng 1 lúc 2 tiến trình cố gắng trừ/tồn kho của một mặt hàng (Race Condition).
**Giải pháp: Optimistic Concurrency Control (OCC) trong EF Core.**

### Thêm thuộc tính Version / RowVersion
```csharp
public class InventoryItem
{
    public Guid Id { get; set; }
    public int Quantity { get; set; }
    
    // Cờ báo hiệu sửa đổi (Concurrency Token)
    [Timestamp] // hoặc thẻ xmin dành riêng cho Postgres (EF Core mapping: IsRowVersion())
    public uint Version { get; set; } 
}
```

**Xử lý trong Handler (Nếu dính chưởng xung đột):**
```csharp
try
{
    item.Quantity -= request.DeductAmount;
    await _dbContext.SaveChangesAsync(); // Nếu Entity bị thằng khác sửa rồi thì văng exception!
}
catch (DbUpdateConcurrencyException ex)
{
    // Bắt lỗi, báo lại "Kho vừa thay đổi, vui lòng thao tác lại" (Retry hoặc Fail).
    return Result.Failure(DomainErrors.Inventory.ConcurrentUpdate);
}
```

✅ **Chốt kiến thức:** Hệ thống dùng EF Core Migration. Các bạn chạy lệnh `dotnet ef migrations add N<Tên> --project src/WMS.Infrastructure --startup-project src/WMS.Api` mỗi khi sửa Model nhé! Hạn chế sửa tay DB.
