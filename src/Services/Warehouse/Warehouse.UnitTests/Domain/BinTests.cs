using Xunit;
using Warehouse.Domain.Entities;
using FluentAssertions;

namespace Warehouse.UnitTests.Domain;

public class BinTests
{
    [Fact]
    public void AssignOrder_Should_UpdateStatusToOccupied()
    {
        // Arrange
        var zoneId = Guid.NewGuid();
        var bin = new Bin(zoneId, "B-01", "Available");
        var orderId = Guid.NewGuid();

        // Act
        bin.AssignOrder(orderId);

        // Assert
        bin.Status.Should().Be("Occupied");
        bin.CurrentOrderId.Should().Be(orderId);
        bin.Version.Should().Be(2);
    }

    [Fact]
    public void Release_Should_UpdateStatusToAvailable()
    {
        // Arrange
        var zoneId = Guid.NewGuid();
        var bin = new Bin(zoneId, "B-01", "Occupied");
        var orderId = Guid.NewGuid();
        bin.AssignOrder(orderId); // Version 2

        // Act
        bin.Release();

        // Assert
        bin.Status.Should().Be("Available");
        bin.CurrentOrderId.Should().BeNull();
        bin.Version.Should().Be(3);
    }

    [Fact]
    public void NewBin_Should_HaveCorrectInitialState()
    {
        // Arrange
        var zoneId = Guid.NewGuid();
        var binCode = "A-101";

        // Act
        var bin = new Bin(zoneId, binCode);

        // Assert
        bin.Status.Should().Be("Available");
        bin.BinCode.Should().Be(binCode);
        bin.CurrentOrderId.Should().BeNull();
        bin.Version.Should().Be(1);
    }
}