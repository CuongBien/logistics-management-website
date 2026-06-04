using Logistics.Core;

namespace Warehouse.Domain.Entities;

/// <summary>
/// Theo dõi tiến trình quét xác nhận đóng gói (verify-pack).
/// Transient — xoá sau khi đơn Pack xong.
/// </summary>
public class PackVerification : Entity<Guid>
{
    public Guid OutboundOrderId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int ScannedQty { get; private set; }
    public DateTime LastScannedAt { get; private set; }
    public string OperatorId { get; private set; } = default!;

    private PackVerification() { }

    public PackVerification(Guid outboundOrderId, string sku, int quantity, string operatorId)
    {
        Id = Guid.NewGuid();
        OutboundOrderId = outboundOrderId;
        Sku = sku;
        ScannedQty = quantity;
        OperatorId = operatorId;
        LastScannedAt = DateTime.UtcNow;
    }

    public void AddQuantity(int qty)
    {
        ScannedQty += qty;
        LastScannedAt = DateTime.UtcNow;
    }
}
