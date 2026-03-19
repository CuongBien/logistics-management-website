# Bài 2: Domain-Driven Design (DDD) Thực Chiến

Dành cho toàn bộ team: DDD là trái tim của kiến trúc Microservices. Nếu chúng ta thiết kế Database-Driven (tạo bảng SQL trước rồi viết class sau), cả hệ thống sẽ rác rối khi quy mô tăng. Trong DDD, ta tập trung vào **Behavior (Hành vi)** chứ không phải Data.

Dưới đây là 4 khái niệm sống còn đục thẳng vào Code (nằm ở thư mục `Project.Domain`).

---

## 🧬 1. Entity (Thực thể)

Thực thể là một đối tượng **CÓ DANH TÍNH (Identity)**. Dù mọi thuộc tính của nó bị thay đổi, nó vẫn là chính nó nhờ vào cái `Id`.

- **Ví dụ thực tế:** Con người. Hôm nay bạn cắt tóc, đổi tên, thay áo... nhưng CMND của bạn không đổi, bạn vẫn là bạn.
- **Code mẫu:** Lớp `User`, `Product`, `Order`.

```csharp
// Đặt tại File: WMS.Domain/Entities/Bin.cs
using Shared.Domain;

public class Bin : Entity
{
    public Guid Id { get; private set; } // Khóa định danh bất di bất dịch
    public string Code { get; private set; } // Ví dụ: "A1-03"
    public bool IsOccupied { get; private set; } // Thuộc tính có thể thay đổi

    public Bin(string code)
    {
        Id = Guid.NewGuid();
        Code = code;
        IsOccupied = false;
    }

    // Hành vi thay đổi thuộc tính
    public void PlaceItem()
    {
        if (IsOccupied) throw new DomainException("Vị trí này đã có hàng!");
        IsOccupied = true;
    }
}
```
*Lưu ý team:* Class `Entity` gốc thường chỉ vứt sẵn 1 thuộc tính `public Guid Id { get; protected set; }` bên trong `Shared.Domain`.

---

## 💎 2. Value Object (Đối tượng giá trị)

Khác với Entity, Value Object **KHÔNG CÓ DANH TÍNH**. Nó được lấy chính những giá trị bên trong nó để nhận dạng. 
- Mọi thuộc tính CẤM được sửa đổi sau khi tạo (Immutable/Read-only).
- **Ví dụ thực tế:** Tờ 100 ngàn đồng. Chẳng ai quan tâm số serial của nó, chỉ biết cầm tờ 100 ngàn nào thì cũng tiêu được y như nhau. Hoặc một `Address` (Địa chỉ).

```csharp
// Đặt tại File: OMS.Domain/ValueObjects/Money.cs
using Shared.Domain;

public class Money : ValueObject
{
    public decimal Amount { get; } // Read-only hoàn toàn
    public string Currency { get; } 

    // Bắt buộc phải truyền Đủ tham số để tạo ra nó 1 lần duy nhất
    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new DomainException("Tiền không được âm.");
        Amount = amount;
        Currency = currency;
    }

    // Ghi đè phương thức GetEqualityComponents để so sánh GIA TRỊ chứ không so sánh bộ nhớ.
    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}
```
*Tip cho Team:* `ValueObject` cực kì hữu dụng cho `Address` (Street, City, ZipCode) hoặc `GeoLocation` (Lat, Lng).

---

## 👑 3. Aggregate Root (Cụm Tổng Thành)

Nếu dự án có 50 cái Entities, làm sao để quản lý nó không gọi nhau chéo ngoe? **Aggregate Root chính là ông Trùm**.
Bất kỳ ai ở ngoài (tầng Application) muốn sờ vào Entity con bên trong, đều LUÔN LUÔN phải nói chuyện thông qua thằng Trùm (Root).

- **Ví dụ:** `Order` là Aggregate Root. `OrderItem` là Entity con. Không ai được quyền lưu thẳng cái `OrderItem` xuống DB, mà phải lôi cái `Order` lên ròi gọi `order.AddItem()`. Cả cụm này được SaveChanges() chung một transaction.

```csharp
// Đặt tại File: OMS.Domain/Aggregates/Order/Order.cs
using Shared.Domain;

// Chú ý class được đánh dấu là AggregateRoot
public class Order : AggregateRoot
{
    public Guid Id { get; private set; }
    
    // Entity con bị che giấu Private
    private readonly List<OrderItem> _items = new();
    
    // Người ngoài chỉ được XEM (Read-only) danh sách con
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public Order() { Id = Guid.NewGuid(); }

    // Người ngoài (Application) muốn thêm Item, phải gọi lệnh của thằng Trùm!
    public void AddItem(Guid productId, Money price)
    {
        // Thằng Trùm đại diện kiểm tra luật khắt khe
        if (_items.Count >= 10) 
            throw new DomainException("Một đơn không được quá 10 món.");

        // Thằng Trùm tự tạo Entity con và nạp vào danh sách
        var newItem = new OrderItem(Id, productId, price);
        _items.Add(newItem);
    }
}
```
*Lưu ý Repository:* Team chỉ thiết kế Repository cho Aggregate Root. Tức là CÓ `IOrderRepository`, tuyệt đối KHÔNG CÓ `IOrderItemRepository`!

---

## 📣 4. Domain Events (Sự Kiện Miền)

Làm sao để biết một `Order` vừa được Confirm để gửi Email cho khách hàng mà không cần viết cái code gửi Email (hay HttpClient) bẩn thỉu vào cái class `Order` đang mộc mạc kia?

**Giải Pháp: Nhờ thằng Root phát ra cái loa (DomainEvent).** Đứa nào ở xa muốn làm gì thì tự đi mà nghe.

```csharp
// Đặt tại File: OMS.Domain/Events/OrderConfirmedDomainEvent.cs
public record OrderConfirmedDomainEvent(Guid OrderId) : IDomainEvent;

// Nằm lại bên trong class Order (Aggregate Root)
public class Order : AggregateRoot
{
    public void Confirm() 
    {
        this.Status = OrderStatus.Confirmed;
        
        // Phát loa nội bộ: "Tôi đã confirm đơn này!"
        // AddDomainEvent là 1 hàm có sẵn kế thừa từ class cha AggregateRoot
        this.AddDomainEvent(new OrderConfirmedDomainEvent(this.Id));
    }
}
```
*Nơi Gửi Đi:* Khi `IUnitOfWork.SaveChangesAsync()` được gọi ở tầng Infrastructure, thư viện EF Core sẽ bị nhóm mình "độ" lại để nó tự động vớt hết các Event cài trong `AddDomainEvent` ném cho MediatR đi làm nhiệm vụ (như gửi Email, hay bắn RabbitMQ chéo qua Microservices Warehouse).

✅ **Chốt Bài 2**: Nắm chắc 4 gạch đầu dòng này, Code của mọi người sẽ tập trung vào Tính Lập Trình (Business Logic) và không bao giờ bị Rác bởi Framework của bên SQL.
