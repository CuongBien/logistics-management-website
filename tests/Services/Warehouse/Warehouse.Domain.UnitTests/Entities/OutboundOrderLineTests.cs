using FluentAssertions;
using Warehouse.Domain.Entities;
using Xunit;

namespace Warehouse.Domain.UnitTests.Entities;

public class OutboundOrderLineTests
{
    [Fact]
    public void AddReservedQty_WhenValid_ShouldIncreaseReservedQty()
    {
        // Arrange
        var order = new OutboundOrder("ORD-01", Guid.NewGuid(), "123 Main St", "HCM");
        order.AddLine("SKU-01", "Cai", 10);
        var line = order.Lines.First();

        // Act
        line.AddReservedQty(5);

        // Assert
        line.ReservedQty.Should().Be(5);
    }

    [Fact]
    public void AddReservedQty_WhenExceedsRequested_ShouldThrowException()
    {
        // Arrange
        var order = new OutboundOrder("ORD-01", Guid.NewGuid(), "123 Main St", "HCM");
        order.AddLine("SKU-01", "Cai", 10);
        var line = order.Lines.First();

        // Act
        Action act = () => line.AddReservedQty(11);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Reserved quantity cannot exceed requested quantity");
    }

    [Fact]
    public void AddPickedQty_WhenExceedsReserved_ShouldThrowException()
    {
        // Arrange
        var order = new OutboundOrder("ORD-01", Guid.NewGuid(), "123 Main St", "HCM");
        order.AddLine("SKU-01", "Cai", 10);
        var line = order.Lines.First();
        line.AddReservedQty(5);

        // Act
        Action act = () => line.AddPickedQty(6);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Picked quantity cannot exceed reserved quantity");
    }

    [Fact]
    public void AddShippedQty_WhenExceedsPacked_ShouldThrowException()
    {
        // Arrange
        var order = new OutboundOrder("ORD-01", Guid.NewGuid(), "123 Main St", "HCM");
        order.AddLine("SKU-01", "Cai", 10);
        var line = order.Lines.First();
        line.AddReservedQty(10);
        line.AddPickedQty(10);
        line.AddPackedQty(5);

        // Act
        Action act = () => line.AddShippedQty(6);

        // Assert
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("Shipped quantity cannot exceed packed quantity");
    }
}
