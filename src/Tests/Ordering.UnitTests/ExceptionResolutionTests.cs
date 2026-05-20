using Ordering.Domain.Entities;
using Ordering.Domain.Enums;
using Ordering.Domain.ValueObjects;
using Xunit;

namespace Ordering.UnitTests;

public class ExceptionResolutionTests
{
    private static Order CreateSampleOrder()
    {
        var address = new Address("1 St", "City", "", "Country", "00000");
        var consignee = new Consignee("Name", "0900000000", address);
        var created = Order.Create("tenant-a", "consignor-a", consignee, 0m, 0m, 1m, null);
        var order = created.Value!;
        order.Confirm();
        return order;
    }

    [Fact]
    public void MarkAwaitingResolution_ShouldChangeStatus()
    {
        // Arrange
        var order = CreateSampleOrder();
        order.MarkPickedUp("driver-1");

        // Act
        var result = order.MarkAwaitingResolution("wh-1");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.AwaitingResolution, order.Status);
        Assert.Equal("wh-1", order.WarehouseId);
    }

    [Fact]
    public void ResolveAcceptPartial_ShouldChangeStatusToInWarehouse()
    {
        // Arrange
        var order = CreateSampleOrder();
        order.MarkPickedUp("driver-1");
        order.MarkAwaitingResolution("wh-1");

        // Act
        var result = order.ResolveAcceptPartial();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.InWarehouse, order.Status);
    }

    [Fact]
    public void ResolveCancel_ShouldChangeStatusToCancelled()
    {
        // Arrange
        var order = CreateSampleOrder();
        order.MarkPickedUp("driver-1");
        order.MarkAwaitingResolution("wh-1");

        // Act
        var result = order.ResolveCancel();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }

    [Fact]
    public void Resolve_WhenNotInResolutionState_ShouldFail()
    {
        // Arrange
        var order = CreateSampleOrder();
        // Order is in AwaitingPickup status

        // Act
        var result = order.ResolveAcceptPartial();

        // Assert
        Assert.True(result.IsFailure);
        Assert.Equal(OrderStatus.AwaitingPickup, order.Status);
    }
}
