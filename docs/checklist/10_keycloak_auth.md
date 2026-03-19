# Bài 10: Trạm Gác An Ninh (Keycloak & JWT)

Đã qua cái thời anh em tự code 1 bảng `Users` có cột `PasswordHash`, `Salt` rồi đi viết API `/api/login` để cấp Token. Việc tự lơ ngơ quản lý mật khẩu người dùng bây giờ là một "Mối nguy an ninh quốc gia".

Toàn bộ hệ thống Logistics của chúng ta **KHÔNG LƯU MẬT KHẨU CỦA AI CẢ**. Nhiệm vụ đó được giao nộp cho **Keycloak** (Phần mềm mã nguồn mở số 1 thế giới về Quản lý danh tính do RedHat phát triển).

---

## 🛡️ 1. OIDC & Vai Trò Của Keycloak

Hệ thống tuân theo chuẩn **OpenID Connect (OIDC)**:
1. **Frontend (Vue/App):** Khi khách bấm "Đăng Nhập", App không gọi API của OMS. Nó gọi thẳng lên cổng `http://localhost:8080` của Keycloak. Bác Keycloak kiểm tra pass, nếu đúng, tung ra 1 cái thẻ nhựa (đó là **JWT - JSON Web Token**).
2. **Backend (OMS/WMS):** Được gọi là `Resource Server` (kho báu). Nó không có chức năng tạo tài khoản. Chiếc thẻ JWT do Frontend truyền vào, Backend sẽ soi cẩn thận dưới máy quét tia X để kiểm tra xem "Thẻ này có đúng là chú Keycloak in ra không?".

---

## 🔑 2. Cài Đặt Tại Backend (Máy Quét Tia X)

Làm sao để OMS biết thẻ nào là thẻ thật, thẻ nào do Hacker tự in bằng Photoshop? Ta cấu hình ở `Program.cs`.

**Ví dụ Code - Gắn máy quét:**
```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // 1. Máy quét gọi sang Keycloak để xin cái Chữ Ký Chuẩn của nhà mạng (Public Keys)
        options.Authority = "http://localhost:8080/realms/lms-realm"; 
        
        // Cấm kiểm tra SSL nội bộ (Dùng cho môi trường Dev)
        options.RequireHttpsMetadata = false; 

        // 2. Chỉnh thuật toán kiểm tra
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,   // Phải đúng là lms-realm phát hành
            ValidateAudience = true, // Phải dành đúng cho App Logistics này
            ValidAudience = "account", // Tên Client ID cấu hình trên Keycloak
            ClockSkew = TimeSpan.Zero // Hết hạn là chết ngay, không du di thêm phút nào
        };
    });
    
// ... (Xuống phía dưới nhớ thêm 2 lệnh này để kích hoạt)
app.UseAuthentication(); // Máy quét thẻ
app.UseAuthorization();  // Bảo vệ cửa phòng (Dựa vào thẻ đã quét)
```

---

## 🛑 3. Chặn Cửa Bằng Thẻ (Attribute Chặn Đứng)

Giờ mọi thứ đã xong, Controller của bạn hoàn toàn an toàn khỏi thế lực bên ngoài nhờ lá bùa `[Authorize]`.

```csharp
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    // Bắt buộc phải có thẻ JWT hợp lệ gắn trong Header "Authorization: Bearer <T0ken_dai_ngoang>"
    [Authorize] 
    [HttpGet("my-profile")]
    public IActionResult GetProfile()
    {
        // CÁCH MÓC LẤY THÔNG TIN CÁ NHÂN TỪ CÁI THẺ JWT RA ĐÂY:
        
        // 1. Móc UserId (Thường lưu ở trường sub - Subject)
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        // 2. Móc Tên thật
        var name = User.FindFirstValue("preferred_username");
        
        // 3. Móc Email
        var email = User.FindFirstValue(ClaimTypes.Email);

        return Ok(new { Id = userId, Name = name, Email = email });
    }
    
    // Nếu bạn muốn chia quyền: Chỉ Quản Lý Kho mới được vào
    [Authorize(Roles = "warehouse_manager")]
    [HttpPost("fire-employee")]
    public IActionResult FireEmployee() 
    {
        return Ok("Đã sa thải.");
    }
}
```

---

## ⚠️ 4. Những Sai Lầm Khi Bị "Phạt Thẻ" Cần Nắm Cho Team

Nếu Frontend cứ bị Backend chửi **401 Unauthorized**, hãy bảo Frontend mở cái Token JWT đó ra dán vào trang [jwt.io](https://jwt.io) để đọc ruột, và tự hỏi 3 câu sau:
1. Thẻ này còn hạn không? (Trường `exp` là timestamp hết hạn $\rightarrow$ Bị 401).
2. Thẻ này có đúng trường phái `lms-realm` cấp không? (Trường `iss`).
3. Dưới Frontend có quên gắn chữ `Bearer ` trước cái token khi truyền Header không?

✅ **Chốt Bài 10:** Xác thực (Authentication) chỉ là kiểm tra cái Thẻ Nhựa xem là Hàng Thật hay Hàng Giả, và trên cái Thẻ Nhựa đó in tên Ai. Backend chỉ cần nạp 2 đoạn code chuẩn trên là xong chuyện. Quá sạch bóng! 

Tuy nhiên, nếu người lạ cứ cầm Token hết hạn bấm quấy nhiễu Backend cả triệu lần 1 ngày $\rightarrow$ Backend sẽ chết vì đuối sức. Để làm nhẹ gánh cho Backend, chúng ta cần một Gã Chặn Cửa Không Cho Gặp. Gã đó tên là **YARP (Bài 11)**.
