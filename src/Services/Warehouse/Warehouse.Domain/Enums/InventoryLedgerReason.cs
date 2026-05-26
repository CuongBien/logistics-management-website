namespace Warehouse.Domain.Enums;

public enum InventoryLedgerReason
{
    InboundReceived = 1,  // Nhập hàng vào bin
    Reserve = 2,          // Giữ hàng cho đơn
    Release = 3,          // Hủy giữ hàng
    Pick = 4,             // Lấy hàng từ bin
    Pack = 5,             // Đóng gói
    Ship = 6,             // Xuất kho thực tế
    Return = 7,           // Hàng trả về
    AdjustIncrease = 8,   // Điều chỉnh tăng (Kiểm kê)
    AdjustDecrease = 9,   // Điều chỉnh giảm (Kiểm kê)
    Expired = 10,         // Hủy giữ do hết hạn (TTL)
    TransitReceived = 11, // Nhận hàng trung chuyển chặng Mega Hub
    InternalTransfer = 12, // Dịch chuyển nội bộ giữa các Bin
    OrderCancelled = 13,
    ReturnToOrigin = 14,
    ReturnDispositionRestock = 15,
    ReturnDispositionScrap = 16
}
