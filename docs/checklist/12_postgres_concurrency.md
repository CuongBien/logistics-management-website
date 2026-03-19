# Bài 12: Chống Bán Khống Cùng Lúc (Concurrency Control)

Tình huống đau đầu nhất ngành Thương Mại Điện Tử & Vận Tải:
Kho WMS còn đúng **1 cái iPhone 16**.
Hai khách hàng A và B cùng lúc (cách nhau 0.001 giây) bấm nút Thanh Toán Mua.
- Hai Request đi qua Gateway, bay vào WMS.
- Hàm `GetByIdAsync()` của cả A và B đều đọc được `Kho.SoLuong = 1`.
- Hàm `Deduct()` của A trừ đi 1 thành `0`.
- Hàm `Deduct()` của B trừ đi 1 thành `0` (vì biến trong RAM của B vẫn đang giữ giá trị cũ là `1`).
- Cả A và B lưu Database. Mọi người vui vẻ. **HỆ QUẢ: Hàng có 1 cái nhưng lại bán cho 2 người! Bạn dính phốt Bán Khống.**

Lỗi này là Cơn Ác Mộng có tên **Race Condition** (Tranh đua).

---

## 🔒 1. Optimistic Concurrency (Lạc Quan) vs Pessimistic (Bi Quan)

- **Bi Quan (Pessimistic Locking):** Đơn vị A vào đọc Kho, khóa trái cửa Database lại (`SELECT ... FOR UPDATE`). Đơn vị B chạy tới phải đứng ngoài chờ. 
  - *Nhược điểm:* Chậm, rất chậm. Nếu là siêu Sale 11/11, khóa cửa kiểu này sập tắc nghẽn toàn hệ thống.
  
- **Lạc Quan (Optimistic Concurrency Control - OCC):** Cứ để cửa mở bét nhè. A và B vào đọc thoải mái. Nhưng khi Lưu (`SaveChanges()`), ai tới trước thì ghi đè thành công. Người tới sau (tầm 0.001 giây) sẽ bị Database đạp văng ra ngoài báo Lỗi "Mày đang sửa dữ liệu cũ rồi!".
  - *Ưu điểm:* Nhanh, mượt, hiệu năng cực cao. Quá hợp cho Logistics.

Dự án này sử dụng mô hình **LẠC QUAN (OCC)**. 

---

## 🛠️ 2. Cách Chống Bán Khống Bằng Code C# (RowVersion)

Chúng ta không cần tự code tay SQL phức tạp, Entity Framework cung cấp cơ chế quá tuyệt vời bằng việc gài một Cột Cờ (Token).

**Bước 1: Thêm cột Theo Dõi Phiên Bản vào Domain Entity**
```csharp
// Đặt tại File: WMS.Domain/Entities/InventoryItem.cs
using Shared.Domain;

public class InventoryItem : Entity
{
    public Guid Id { get; private set; }
    public int Quantity { get; private set; }
    
    // Cột Cờ: Bất cứ ai chạm vào sửa dòng này, Database tự động Update biến uint này lên 1 số mới
    public uint Version { get; private set; } 

    // Constructor...
    
    public void Deduct(int amount)
    {
        if (Quantity < amount) 
            throw new DomainException("Kho không đủ hàng.");
        
        Quantity -= amount;
    }
}
```

**Bước 2: Cấu hình EF Core Nhận Diện Cột Cờ (Tầng Infrastructure)**
```csharp
// Đặt tại File: WMS.Infrastructure/Persistence/Configurations/InventoryItemConfiguration.cs
public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.HasKey(x => x.Id);
        
        // Bật phép thuật Nhận Hình Nhân Thế Mạng
        // Với Postgres, IsRowVersion() sẽ tự động map với thẻ ẩn "xmin" nội bộ cực kỳ mạnh!
        builder.Property(x => x.Version)
               .IsRowVersion(); 
    }
}
```

---

## 🛡️ 3. Cách Bắt Lỗi và Báo Cho Người Dùng

Sau khi gắn Cột Cờ, chuyện gì xảy ra ở tình huống đầu bài?
- A và B vào đọc: Cả 2 đều thấy `Kho.Quantity = 1`, `Kho.Version = 100`.
- A tới trước lưu lại: Lúc này DB kiểm tra xem `Version` truyền xuống có bằng `100` không? CÓ. Nên nó cập nhật `Quantity = 0`, và **đẩy `Version = 101`**.
- B tới trễ 0.001s lưu lại: DB mang `Version = 100` của B đi rà soát. Ủa? Thằng trong DB đang là `101` mà? $\rightarrow$ KẺ XÂM NHẬP DỮ LIỆU CŨ! Quăng lỗi `DbUpdateConcurrencyException`.

**Code bắt lỗi tại CQRS Command Handler:**
```csharp
public async Task<Result<bool>> Handle(DeductInventoryCommand request, CancellationToken ct)
{
    var item = await _repo.GetByIdAsync(request.SkuId);
    
    try 
    {
        item.Deduct(request.Amount); // Nghiệp vụ trừ kho
        await _uow.SaveChangesAsync(ct); // A và B giành nhau Lưu
        
        // Lệnh của A sẽ chạy trót lọt về đích
        return Result.Success(true);
    }
    // Lệnh của B bị EF Core bắn hạ lập tức
    catch (DbUpdateConcurrencyException ex) 
    {
        // Gói Exception đáng sợ kia thành Hộp Result sạch sẽ quăng ra (Bài 4)
        return Result.Failure<bool>(DomainErrors.Inventory.ConcurrentUpdate);
    }
}
```

*(Sau đó Controller ở tầng API sẽ nhận hộp Result Lỗi này và báo cho App Khách Hàng B: "Sản phẩm vừa bị người khác mua mất, vui lòng tải lại trang!")*

✅ **Chốt Bài 12:** Toàn bộ kiến trúc Database trên thế giới nếu liên quan tiền nong, kho bãi đều PHẢI dính tới bộ phận Concurrency. Chỉ với 1 cờ `Version` và `try/catch` DbUpdateConcurrencyException, team ta tự tin đỡ mọi cú đúp click của User hoặc Spam bot trên App/Web.

Còn 2 bài cuối cùng của khoá đào tạo nội bộ. Khi hàng vạn user xô vào mua sắm, làm sao ta biết cái Request đó hiện đang bị Nghẽn ở Cổng YARP hay kẹt ở WMS? Mời team qua **Bài 13: Distributed Tracing (OpenTelemetry)**.
