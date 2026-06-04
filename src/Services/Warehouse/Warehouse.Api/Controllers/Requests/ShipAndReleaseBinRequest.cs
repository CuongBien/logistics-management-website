namespace Warehouse.Api.Controllers.Requests;

/// <summary>
/// Request: Quét mã QR nhãn vận chuyển để xuất hàng và giải phóng ô kệ
/// </summary>
public class ShipAndReleaseBinRequest
{
    /// <summary>Mã đơn hàng (OrderNo) từ QR nhãn vận chuyển</summary>
    public string OrderNo { get; set; } = default!;
}
