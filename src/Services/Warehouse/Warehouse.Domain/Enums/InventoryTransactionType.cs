namespace Warehouse.Domain.Enums;

public enum InventoryTransactionType
{
    Inbound = 1,       // Nhập hàng mới
    Outbound = 2,      // Xuất hàng thực tế (Consume)
    Reservation = 3,   // Ghi nhận giữ hàng (Logic change)
    Release = 4,       // Nhả hàng giữ (Logic change)
    Adjustment = 5,    // Điều chỉnh kho (Tăng/Giảm tay)
    Stocktake = 6,     // Kiểm kê (Cân đối kho)
    Expired = 7        // Tự động hủy giữ hàng do hết hạn
}
