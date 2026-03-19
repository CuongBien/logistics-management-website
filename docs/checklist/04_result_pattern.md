# Bài 4: Sự Sụp Đổ Của Try/Catch (Result Pattern)

Trong kiến trúc cũ, khi một nghiệp vụ bị lỗi (ví dụ: Không tìm thấy khách, hoặc kho hết hàng), coder thường xài `throw new Exception("Hết hàng")`. Điều này **CỰC KỲ TỆ**. Tại sao?

1. **Hiệu năng:** Việc máy chủ giật mình nảy ra 1 cái Exception tốn RẤT RẤT nhiều tài nguyên (Nó lôi nguyên cục RAM StackTrace nặng chịch ra quét).
2. **Khó kiểm soát:** Người gọi hàm (Controller) không thể biết hàm này có thể văng ra bao nhiêu loại lỗi để mà `catch`. Cuối cùng sinh ra bug "vỡ 500 nát bét màn hình" khi lên Production.

**Giải pháp của Team Logistics:** Trả về một hộp gói kín gọi là **`Result<T>`**. Bóc hộp ra sẽ biết Thành Công hay Thất Bại, nếu thất bại thì kèm mã Lỗi rõ ràng.

---

## 🚫 1. Định Nghĩa Cấu Trúc Lỗi Chuẩn Mực

Thay vì quăng lỗi bằng chữ string bừa bãi ("Lỗi rồi", "Hết kho"...), chúng ta tạo một Record cố định cho `Error`. Mọi lỗi trong hệ thống phải nằm trong thẻ thư viện `DomainErrors`.

**Ví dụ Code - Lưu mã lỗi giống như từ điển**:
```csharp
// Đặt tại File: Shared.Domain/Error.cs
public record Error(string Code, string Message)
{
    // Lỗi rỗng (Đại diện cho việc Không Có Lỗi)
    public static readonly Error None = new(string.Empty, string.Empty);
}

// ------------------------------------

// Đặt tại File: OMS.Domain/Errors/DomainErrors.cs
// Toàn bộ lỗi của nhóm hệ thống OMS được quy hoạch chung vào 1 file!
public static class DomainErrors // class static để dùng ở mọi nơi
{
    public static class Order
    {
        public static readonly Error NotFound = new(
            "Order.NotFound", 
            "Không tìm thấy mã đơn hàng yêu cầu trong hệ thống.");
            
        public static readonly Error OutOfStock = new(
            "Order.OutOfStock", 
            "Sản phẩm này đã hết hàng tại Kho.");
    }
}
```

---

## 🎁 2. Chiếc Hộp Thần Kỳ `Result<T>`

Class `Result` là cái vỏ bọc bao gồm: (1) Cờ `IsSuccess`, (2) Object `Value` (nếu thành công), và (3) Object `Error` (nếu thất bại).

**Cách Handler trả về Kết Quả mượt mà (Không dùng Throw):**
```csharp
internal sealed class ReserveInventoryCommandHandler : IRequestHandler<ReserveInventoryCommand, Result<bool>>
{
    // Trong hàm Handle (MediatR), ta không quăng Exception:
    public async Task<Result<bool>> Handle(ReserveInventoryCommand request, CancellationToken ct)
    {
        var item = await _repo.GetItemAsync(request.Sku);
        
        if (item is null)
        {
            // Trả về thẳng một hộp Lỗi cấu trúc chuẩn!
            return Result.Failure<bool>(DomainErrors.Order.NotFound);
        }

        if (item.Stock < request.Quantity)
        {
            // Báo hết hàng
            return Result.Failure<bool>(DomainErrors.Order.OutOfStock);
        }

        item.Deduct();
        await _uow.SaveChangesAsync(ct);
        
        // Trả về hộp Thành Công mĩ mãn
        return Result.Success(true);
    }
}
```

---

## 🌐 3. Cách Controller Thể Hiện Cho Frontend Hiểu (ProblemDetails)

Frontend (Vue/React hoặc App Mobile) không thể tự hiểu cái `Result<T>` của C# được. Bọn nó chỉ hiểu HTTP Status Code (200, 400, 404). Do đó, Cô Lễ Tân (Controller) phải nhận cái Hộp. Nếu thấy Hộp chứa Lỗi $\rightarrow$ Dịch Lỗi đó ra chuẩn **ProblemDetails (RFC 7807)** của World Wide Web.

**Ví dụ Code - Dịch thẻ Error sang JSON lỗi của HTTP:**
```csharp
// Đặt tại File: OMS.Api/Controllers/InventoryController.cs
[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly ISender _sender;

    public InventoryController(ISender sender) => _sender = sender;

    [HttpPost("reserve")]
    public async Task<IActionResult> Reserve([FromBody] ReserveInventoryCommand command)
    {
        Result<bool> result = await _sender.Send(command);

        // THÀNH CÔNG: Quăng ra HTTP 200 OK kẹp theo Dữ Liệu
        if (result.IsSuccess)
        {
            return Ok(result.Value); 
        }
        
        // THẤT BẠI: Quăng ra HTTP 400 Bad Request kèm format chuẩn để App Mobile đọc được
        return BadRequest(new ProblemDetails
        {
            Title = "Bad Request (Lỗi Nghiệp vụ)",
            Status = StatusCodes.Status400BadRequest,
            Type = result.Error.Code,       // Ví dụ: "Order.OutOfStock"
            Detail = result.Error.Message   // Ví dụ: "Sản phẩm này đã hết hàng tại Kho."
        });
    }
}
```

✅ **Tổng kết Vàng Dành Cho Mem Xịn:** Trừ khi lỗi liên quan đến sập hạ tầng (như mất mạng, chết Database) thì ta mới để hệ thống tự quăng Exception 500 Internal Server Error. Còn mọi lỗi liên quan đến CON NGƯỜI (user làm sai, điền thiếu form, mua lấn kho) thì 100% phải gói vào `Result.Failure` và quăng mượt chát ra ngoài dưới dạng HTTP 400 (Bad Request). 

Đây là cảnh giới cuối cùng của Clean Code để kết thúc Phần 1 của lộ trình Team!
