using Warehouse.Domain.Entities;
using Warehouse.Domain.Exceptions;
using Xunit;

namespace Warehouse.Api.Tests;

public class WarehouseDomainInvariantTests
{
    [Fact]
    public void ReserveStock_Throws_WhenQuantityExceedsAvailable()
    {
        var inventory = InventoryItem.Create("SKU-RED-TSHIRT", 5, "tenant-1", "customer-1");

        Assert.Throws<InsufficientStockException>(() => inventory.ReserveStock(6));
    }

    [Fact]
    public void InboundItem_Throws_WhenQuantityIsZeroOrNegative()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new InboundItem(Guid.NewGuid(), "SKU-RED-TSHIRT", 0, "tenant-1", "customer-1"));
    }
}
