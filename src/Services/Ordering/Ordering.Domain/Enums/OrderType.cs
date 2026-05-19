namespace Ordering.Domain.Enums;

public enum OrderType
{
    Parcel = 1,          // Đơn vận chuyển: có người nhận cụ thể
    InboundRequest = 2   // Yêu cầu nhập hàng vào kho lưu trữ
}

public enum FulfillmentMode
{
    Pickup = 1,    // Tài xế pickup từ người gửi (luồng Saga bình thường)
    Warehouse = 2  // Xuất từ tồn kho sẵn có trên kệ (luồng WMS Allocate/Pick/Pack)
}
