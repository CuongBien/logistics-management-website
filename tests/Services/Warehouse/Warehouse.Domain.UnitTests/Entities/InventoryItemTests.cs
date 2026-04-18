using FluentAssertions;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Domain.UnitTests.Entities;

public class InventoryItemTests
{
    [Fact]
    public void Create_WithValidData_ReturnsInventoryItem()
    {
        // Arrange
        string sku = "IPHONE-15-PRM";
        int initialQty = 100;

        // Act
        var item = InventoryItem.Create(sku, initialQty);

        // Assert
        item.Should().NotBeNull();
        item.Id.Should().NotBeEmpty();
        item.Sku.Should().Be(sku);
        item.QuantityOnHand.Should().Be(initialQty);
        item.ReservedQty.Should().Be(0);
        item.AvailableQty.Should().Be(initialQty);
        item.Version.Should().Be(1);
        item.LastRestockedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void Create_WithNegativeQuantity_ThrowsArgumentOutOfRangeException()
    {
        // Arrange & Act
        Action act = () => InventoryItem.Create("IPHONE-15", -10);

        // Assert
        act.Should().Throw<ArgumentOutOfRangeException>()
           .WithMessage("*initialQty*");
    }

    [Fact]
    public void ReserveStock_WithValidQuantity_IncreasesReservedQtyAndVersion()
    {
        // Arrange
        var item = InventoryItem.Create("IPHONE-15", 100);

        // Act
        item.ReserveStock(40);

        // Assert
        item.ReservedQty.Should().Be(40);
        item.QuantityOnHand.Should().Be(100);
        item.AvailableQty.Should().Be(60);
        item.Version.Should().Be(2); // increased from 1
    }

    [Fact]
    public void ReserveStock_WithInsufficientStock_ThrowsInsufficientStockException()
    {
        // Arrange
        var item = InventoryItem.Create("IPHONE-15", 10);

        // Act
        Action act = () => item.ReserveStock(15);

        // Assert
        act.Should().Throw<InsufficientStockException>();
        item.ReservedQty.Should().Be(0); // Should not have changed
        item.Version.Should().Be(1); // Should not have changed
    }

    [Fact]
    public void Deduct_WithValidQuantity_DecreasesQuantityOnHandAndVersion()
    {
        // Arrange
        var item = InventoryItem.Create("IPHONE-15", 100);
        item.ReserveStock(20); // 20 initially reserved

        // Act
        item.Deduct(10); // Deduct purely physical (doesn't modify Reserved automatically in domain unless explicitly synced)

        // Assert
        item.QuantityOnHand.Should().Be(90);
        item.ReservedQty.Should().Be(20);
        item.AvailableQty.Should().Be(70);
        item.Version.Should().Be(3); // 1 (create) + 1 (reserve) + 1 (deduct)
    }

    [Fact]
    public void Restock_WithValidQuantity_IncreasesQuantityOnHandAndUpdateLastRestockedAt()
    {
        // Arrange
        var item = InventoryItem.Create("IPHONE-15", 100);
        var oldRestockTime = item.LastRestockedAt;

        // Simulate some time passed
        Thread.Sleep(10);

        // Act
        item.Restock(50);

        // Assert
        item.QuantityOnHand.Should().Be(150);
        item.AvailableQty.Should().Be(150);
        item.Version.Should().Be(2);
        item.LastRestockedAt.Should().BeAfter(oldRestockTime!.Value);
    }
}
