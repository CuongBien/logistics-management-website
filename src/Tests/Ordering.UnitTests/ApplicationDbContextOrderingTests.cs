using MediatR;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Entities;
using Ordering.Domain.Enums;
using Ordering.Domain.ValueObjects;
using Ordering.Infrastructure.Persistence;
using Xunit;

namespace Ordering.UnitTests;

public sealed class ApplicationDbContextOrderingTests
{
    private static ApplicationDbContext CreateContext(
        IOrderTransitionContext transitionContext,
        out SqliteConnection connection)
    {
        connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(connection)
            .Options;

        var mediator = new Mock<IMediator>();
        mediator
            .Setup(m => m.Publish(It.IsAny<INotification>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var ctx = new ApplicationDbContext(options, mediator.Object, transitionContext);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    private static Order CreateSampleOrder()
    {
        var address = new Address("1 St", "City", "", "Country", "00000");
        var consignee = new Consignee("Name", "0900000000", address);
        var created = Order.Create("tenant-a", "consignor-a", consignee, 0m, 0m, 1m, null);
        Assert.False(created.IsFailure);
        var order = created.Value!;
        var confirm = order.Confirm();
        Assert.False(confirm.IsFailure);
        return order;
    }

    [Fact]
    public async Task OrderStatusHistory_Writes_OnValidTransition()
    {
        var transition = new StubOrderTransitionContext("operator-1", "corr-abc");
        using var ctx = CreateContext(transition, out _);
        var order = CreateSampleOrder();
        ctx.Orders.Add(order);
        await ctx.SaveChangesAsync();

        var afterCreate = await ctx.OrderStatusHistories.CountAsync();
        Assert.Equal(1, afterCreate);

        var pickup = order.MarkPickedUp("driver-1");
        Assert.False(pickup.IsFailure);
        await ctx.SaveChangesAsync();

        var rows = await ctx.OrderStatusHistories.OrderBy(h => h.ChangedAtUtc).ToListAsync();
        Assert.Equal(2, rows.Count);
        Assert.Equal("AwaitingPickup", rows[1].StatusFrom);
        Assert.Equal("PickedUp", rows[1].StatusTo);
        Assert.Equal("operator-1", rows[1].Source);
        Assert.Equal("operator-1", rows[1].ChangedByOperatorId);
        Assert.Equal("corr-abc", rows[1].CorrelationId);
    }

    [Fact]
    public async Task OrderStatusHistory_NotWritten_OnInvalidTransition()
    {
        var transition = new StubOrderTransitionContext(null, null);
        using var ctx = CreateContext(transition, out _);
        var order = CreateSampleOrder();
        ctx.Orders.Add(order);
        await ctx.SaveChangesAsync();

        var deliver = order.MarkDelivered("https://pod");
        Assert.True(deliver.IsFailure);
        await ctx.SaveChangesAsync();

        var count = await ctx.OrderStatusHistories.CountAsync();
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task OrderItems_Unique_SameOrderSameSkuCode_Throws()
    {
        var transition = new StubOrderTransitionContext(null, null);
        using var ctx = CreateContext(transition, out _);
        var order = CreateSampleOrder();
        ctx.Orders.Add(order);
        await ctx.SaveChangesAsync();

        var sku = Guid.NewGuid();
        var item1 = new OrderItem(sku, 1, 1m);
        item1.SetSkuCode("dup-sku");
        ctx.OrderItems.Add(item1);
        ctx.Entry(item1).Property(nameof(OrderItem.OrderId)).CurrentValue = order.Id;

        var item2 = new OrderItem(sku, 2, 2m);
        item2.SetSkuCode("dup-sku");
        ctx.OrderItems.Add(item2);
        ctx.Entry(item2).Property(nameof(OrderItem.OrderId)).CurrentValue = order.Id;

        await Assert.ThrowsAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
    }

    [Fact]
    public async Task OrderStatusHistory_PopulatesReasonOnFail()
    {
        var transition = new StubOrderTransitionContext("op-fail", null);
        using var ctx = CreateContext(transition, out _);
        var order = CreateSampleOrder();
        order.MarkPickedUp("d1");
        order.MarkInWarehouse("w1", "recv");
        order.MarkSorted("dest-wh");
        order.MarkDispatched("drv", "route-1");
        ctx.Orders.Add(order);
        await ctx.SaveChangesAsync();

        var fail = order.MarkFailed("address-mismatch");
        Assert.False(fail.IsFailure);
        await ctx.SaveChangesAsync();

        var last = await ctx.OrderStatusHistories
            .OrderByDescending(h => h.ChangedAtUtc)
            .FirstAsync();
        Assert.Equal(OrderStatus.Failed.ToString(), last.StatusTo);
        Assert.Equal("address-mismatch", last.Reason);
    }
}
