namespace OMS.Domain.Enums;

public enum OrderStatus
{
    New = 1,               // Consignor vừa tạo đơn trên hệ thống
    Confirmed = 2,         // Validate xong, sinh WaybillCode
    AwaitingPickup = 3,    // Đợi shipper tới lấy hàng
    PickedUp = 4,          // 👤 Shipper đã scan lấy hàng
    AwaitingInbound = 5,   // Đang trên đường về kho
    InWarehouse = 6,       // 👤 Nhân viên kho đã scan nhập
    Sorting = 7,           // 👤 Đang phân loại theo vùng
    AwaitingDispatch = 8,  // Chờ quản lý duyệt tuyến xe
    Dispatched = 9,        // 👤 QĐ đã assign tài xế
    Delivering = 10,       // 👤 Tài xế đang giao
    Delivered = 11,        // 👤 Tài xế xác nhận giao thành công
    Completed = 12,        // Đối soát COD xong
    Failed = 13,           // Giao thất bại
    Cancelled = 14,        // Hủy đơn
    ReturnInTransit = 15   // Đang hoàn trả về Consignor
}
