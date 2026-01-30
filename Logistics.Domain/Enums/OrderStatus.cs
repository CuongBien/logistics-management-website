namespace Logistics.Domain.Enums
{
    public enum OrderStatus
    {
        New = 0,                // Mới tạo
        Confirmed = 1,          // Đã xác nhận
        Assigned = 2,           // Đã điều phối tới tài xế/xe
        Picking = 3,            // Đang đi lấy hàng
        PickedUp = 4,           // Đã lấy hàng thành công
        InTransit = 5,          // Đang vận chuyển
        Delivered = 6,          // Giao hoàn thành
        Completed = 7,          // Hoàn tất (đối soát/thanh toán xong)
        Cancelled = 99          // Đã hủy
    }
}
