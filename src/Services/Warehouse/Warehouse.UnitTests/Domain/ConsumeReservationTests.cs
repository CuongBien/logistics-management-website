using System;
using FluentAssertions;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Exceptions;
using Xunit;

namespace Warehouse.UnitTests.Domain;

public class ConsumeReservationTests
{
    private readonly Guid _warehouseId = Guid.NewGuid();
    private readonly Guid _binId = Guid.NewGuid();

    [Fact]
    public void ConsumeReserved_WhenEnoughReserved_ShouldDecreaseBothAndIncreaseVersion()
    {
        var item = InventoryItem.Create("SKU-XYZ", 10, "tenant", "customer", _warehouseId, _binId);
        item.ReserveStock(5);
        var versionBefore = item.Version;

        item.ConsumeReserved(3);

        item.QuantityOnHand.Should().Be(7);
        item.ReservedQty.Should().Be(2);
        item.Version.Should().Be(versionBefore + 1);
    }

    [Fact]
    public void ConsumeReserved_WhenNotEnoughReserved_ShouldThrow()
    {
        var item = InventoryItem.Create("SKU-XYZ", 10, "tenant", "customer", _warehouseId, _binId);
        item.ReserveStock(2);

        Action act = () => item.ConsumeReserved(3);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void ConsumeReserved_WhenInsufficientOnHand_ShouldThrowInsufficientStock()
    {
        var item = InventoryItem.Create("SKU-XYZ", 2, "tenant", "customer", _warehouseId, _binId);
        item.ReserveStock(2);

        Action act = () => item.ConsumeReserved(3);

        act.Should().Throw<InsufficientStockException>();
    }
}
