using System;
using FluentAssertions;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Exceptions;
using Xunit;

namespace Warehouse.UnitTests.Domain;

public class InventoryItemTests
{
    private readonly Guid _warehouseId = Guid.NewGuid();
    private readonly Guid _binId = Guid.NewGuid();

    [Fact]
    public void ReserveStock_WhenQuantityExceedsAvailable_ShouldThrowInsufficientStockException()
    {
        var item = InventoryItem.Create("SKU-ABC", 5, "tenant", "customer", _warehouseId, _binId);

        Action act = () => item.ReserveStock(6);

        act.Should().Throw<InsufficientStockException>();
    }

    [Fact]
    public void ReleaseReservation_ShouldDecreaseReservedQty_AndIncreaseVersion()
    {
        var item = InventoryItem.Create("SKU-ABC", 10, "tenant", "customer", _warehouseId, _binId);
        item.ReserveStock(4);
        var versionBefore = item.Version;

        item.ReleaseReservation(4);

        item.ReservedQty.Should().Be(0);
        item.Version.Should().Be(versionBefore + 1);
    }

    [Fact]
    public void Deduct_WhenWouldViolateReservedInvariant_ShouldThrowAndNotChangeState()
    {
        var item = InventoryItem.Create("SKU-ABC", 10, "tenant", "customer", _warehouseId, _binId);
        item.ReserveStock(6); // reserved = 6, onhand = 10
        var qtyOnHandBefore = item.QuantityOnHand;
        var reservedBefore = item.ReservedQty;
        var versionBefore = item.Version;

        Action act = () => item.Deduct(5); // would reduce onhand to 5, reserved (6) > onhand -> should throw

        act.Should().Throw<InvalidOperationException>();

        // state should be unchanged
        item.QuantityOnHand.Should().Be(qtyOnHandBefore);
        item.ReservedQty.Should().Be(reservedBefore);
        item.Version.Should().Be(versionBefore);
    }

    [Fact]
    public void Deduct_WhenInsufficientOnHand_ShouldThrowInsufficientStockException()
    {
        var item = InventoryItem.Create("SKU-ABC", 3, "tenant", "customer", _warehouseId, _binId);

        Action act = () => item.Deduct(5);

        act.Should().Throw<InsufficientStockException>();
    }
}
