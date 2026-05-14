using Warehouse.Domain.Entities;
using Warehouse.Domain.Exceptions;
using Xunit;

namespace Warehouse.Api.Tests;

public class WarehouseDomainInvariantTests
{
    [Fact]
    public void ReserveStock_Throws_WhenQuantityExceedsAvailable()
    {
        var warehouseId = Guid.NewGuid();
        var binId = Guid.NewGuid();
        var inventory = InventoryItem.Create("SKU-RED-TSHIRT", 5, "tenant-1", "customer-1", warehouseId, binId);

        Assert.Throws<InsufficientStockException>(() => inventory.ReserveStock(6));
    }

    [Fact]
    public void InboundReceiptLine_Throws_WhenExpectedQuantityIsZeroOrNegative()
    {
        var receiptId = Guid.NewGuid();
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new InboundReceiptLine(receiptId, 1, "tenant-1", "customer-1", "SKU-RED-TSHIRT", "EA", 0));
    }
}
