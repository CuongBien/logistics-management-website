// Spec: specs/001-inbound-schema/spec.md
// Test plan: specs/001-inbound-schema/test-plan.md

using EventBus.Messages.Events;
using MassTransit;
using Moq;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ForceCloseReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Domain.Entities;
using Xunit;

namespace Warehouse.Api.Tests.Inbound;

/// <summary>
/// Application handler tests (MediatR, WMS InMemory, MassTransit publish mock).
/// Trace: FR-001, SC-005; AC-001; CreateInboundReceiptCommandHandler, ForceCloseReceiptCommandHandler, ReceiveInboundItemCommandHandler.
/// </summary>
public sealed class InboundApplicationAcceptanceScaffoldTests
{
    [Fact]
    public async Task CreateReceipt_WhenDuplicateWarehouseSourceShipment_ThenFailure()
    {
        await using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var (wh, _, _) = InboundTestFixtures.SeedReceiveInfrastructure(ctx, "t1", "c1", "op-sub");
        var orderId = Guid.NewGuid();
        var handler = new CreateInboundReceiptCommandHandler(ctx);
        var cmd = new CreateInboundReceiptCommand(orderId, "t1", "c1", wh.Id, null, null);

        var first = await handler.Handle(cmd, CancellationToken.None);
        var second = await handler.Handle(cmd, CancellationToken.None);

        Assert.True(first.IsSuccess);
        Assert.True(second.IsFailure);
        Assert.Equal("InboundReceipt.AlreadyExists", second.Error.Code);
    }

    [Fact]
    public async Task ForceClose_WhenSourceRefParsesAsGuid_ThenPublishCalled()
    {
        await using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var (wh, _, _) = InboundTestFixtures.SeedReceiveInfrastructure(ctx, "t1", "c1", "op-sub");
        var orderId = Guid.NewGuid();
        var create = new CreateInboundReceiptCommandHandler(ctx);
        var createResult = await create.Handle(
            new CreateInboundReceiptCommand(
                orderId,
                "t1",
                "c1",
                wh.Id,
                "SHIP-FC",
                [new ExpectedReceiptLine("SKU-1", 100)]),
            CancellationToken.None);
        Assert.True(createResult.IsSuccess);

        var publish = new Mock<IPublishEndpoint>();
        publish
            .Setup(p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var forceHandler = new ForceCloseReceiptCommandHandler(ctx, publish.Object);
        var result = await forceHandler.Handle(
            new ForceCloseReceiptCommand(createResult.Value!, "t1", "closer-sub"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        publish.Verify(
            p => p.Publish(
                It.Is<ShipmentReceivedIntegrationEvent>(e => e.OrderId == orderId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ForceClose_WhenSourceRefNotGuid_ThenPublishNotRequired()
    {
        await using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var (wh, _, _) = InboundTestFixtures.SeedReceiveInfrastructure(ctx, "t1", "c1", "op-sub");

        var receipt = new InboundReceipt("t1", "c1", wh.Id, "RCV-NG", "PURCHASE_ORDER", "EXT-PO-99", "SHIP-NG");
        var line = new InboundReceiptLine(receipt.Id, 1, "t1", "c1", "SKU-X", "EA", 5);
        receipt.AddLine(line);
        ctx.InboundReceipts.Add(receipt);
        ctx.InboundReceiptLines.Add(line);
        await ctx.SaveChangesAsync();

        var publish = new Mock<IPublishEndpoint>();
        publish
            .Setup(p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var forceHandler = new ForceCloseReceiptCommandHandler(ctx, publish.Object);
        var result = await forceHandler.Handle(
            new ForceCloseReceiptCommand(receipt.Id, "t1", "closer-sub"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        publish.Verify(
            p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ReceiveInboundItem_WhenReceiptAlreadyCompleted_ThenImmutableError()
    {
        await using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var tenant = "t1";
        var customer = "c1";
        var operatorSub = "op-sub";
        var (wh, _, binCode) = InboundTestFixtures.SeedReceiveInfrastructure(ctx, tenant, customer, operatorSub);

        var orderId = Guid.NewGuid();
        var create = new CreateInboundReceiptCommandHandler(ctx);
        var createResult = await create.Handle(
            new CreateInboundReceiptCommand(
                orderId,
                tenant,
                customer,
                wh.Id,
                "SHIP-IMM",
                [new ExpectedReceiptLine("SKU-1", 10)]),
            CancellationToken.None);
        Assert.True(createResult.IsSuccess);

        var publish = new Mock<IPublishEndpoint>();
        publish
            .Setup(p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var receive = new ReceiveInboundItemCommandHandler(ctx, publish.Object);
        var receiptId = createResult.Value!;

        var first = await receive.Handle(
            new ReceiveInboundItemCommand(receiptId, orderId, tenant, "SKU-1", binCode, operatorSub, 10),
            CancellationToken.None);
        Assert.True(first.IsSuccess);

        var second = await receive.Handle(
            new ReceiveInboundItemCommand(receiptId, orderId, tenant, "SKU-1", binCode, operatorSub, 1),
            CancellationToken.None);
        Assert.True(second.IsFailure);
        Assert.Equal("InboundReceipt.Immutable", second.Error.Code);
    }
}
