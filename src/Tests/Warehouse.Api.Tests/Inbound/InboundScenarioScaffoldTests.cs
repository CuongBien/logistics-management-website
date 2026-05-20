// Spec: specs/001-inbound-schema/spec.md — User Scenarios §34–54
// Test plan: specs/001-inbound-schema/test-plan.md

using EventBus.Messages.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ForceCloseReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Application.Features.Inbound.Consumers;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Infrastructure.Persistence;
using Xunit;

namespace Warehouse.Api.Tests.Inbound;

/// <summary>User-scenario style tests over the same paths as production handlers and consumers.</summary>
public sealed class InboundScenarioScaffoldTests
{
    [Fact]
    public async Task Scenario1_StandardFullReceive_EndToEnd()
    {
        await using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var tenant = "t1";
        var customer = "c1";
        var op = "op-sub";
        var (wh, _, binCode) = InboundTestFixtures.SeedReceiveInfrastructure(ctx, tenant, customer, op);

        var orderId = Guid.NewGuid();
        var create = new CreateInboundReceiptCommandHandler(ctx);
        var created = await create.Handle(
            new CreateInboundReceiptCommand(
                orderId,
                tenant,
                customer,
                wh.Id,
                "SHIP-S1",
                [new ExpectedReceiptLine("SKU-1", 40)]),
            CancellationToken.None);
        Assert.True(created.IsSuccess);
        var receiptId = created.Value!;
        var receipt = await ctx.InboundReceipts.FindAsync(receiptId);
        Assert.NotNull(receipt);

        var publish = new Mock<IPublishEndpoint>();
        publish.Setup(p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var receive = new ReceiveInboundItemCommandHandler(ctx, publish.Object);
        Assert.True((await receive.Handle(
            new ReceiveInboundItemCommand(receiptId, orderId, tenant, "SKU-1", binCode, op, 40),
            CancellationToken.None)).IsSuccess);

        await ctx.Entry(receipt).ReloadAsync();
        Assert.Equal(InboundReceiptStatus.Completed, receipt.Status);
    }

    [Fact]
    public async Task Scenario2_PartialReceiveThenForceClose_EndToEnd()
    {
        await using var ctx = InboundTestFixtures.CreateInMemoryDb();
        var tenant = "t1";
        var customer = "c1";
        var op = "op-sub";
        var (wh, _, binCode) = InboundTestFixtures.SeedReceiveInfrastructure(ctx, tenant, customer, op);

        var orderId = Guid.NewGuid();
        var create = new CreateInboundReceiptCommandHandler(ctx);
        var createResult = await create.Handle(
            new CreateInboundReceiptCommand(
                orderId,
                tenant,
                customer,
                wh.Id,
                "SHIP-S2",
                [new ExpectedReceiptLine("SKU-1", 100)]),
            CancellationToken.None);
        Assert.True(createResult.IsSuccess);
        var receiptId = createResult.Value!;

        var publishReceive = new Mock<IPublishEndpoint>();
        publishReceive.Setup(p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var receive = new ReceiveInboundItemCommandHandler(ctx, publishReceive.Object);
        Assert.True((await receive.Handle(
            new ReceiveInboundItemCommand(receiptId, orderId, tenant, "SKU-1", binCode, op, 30),
            CancellationToken.None)).IsSuccess);

        var publishClose = new Mock<IPublishEndpoint>();
        publishClose.Setup(p => p.Publish(It.IsAny<ShipmentReceivedIntegrationEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        var force = new ForceCloseReceiptCommandHandler(ctx, publishClose.Object);
        Assert.True((await force.Handle(
            new ForceCloseReceiptCommand(receiptId, tenant, op),
            CancellationToken.None)).IsSuccess);

        var receipt = await ctx.InboundReceipts.FindAsync(receiptId);
        Assert.NotNull(receipt);
        await ctx.Entry(receipt!).Collection(r => r.Lines).LoadAsync();
        var line = Assert.Single(receipt!.Lines);
        Assert.Equal(70, line.ShortageQty);
        Assert.Equal(InboundReceiptStatus.CompletedWithExceptions, receipt.Status);
    }

    [Fact(Skip = "ReceiveInboundItemCommand has no rejected-quantity path; domain coverage in InboundDomainAcceptanceScaffoldTests AC-021.")]
    public void Scenario3_ReceiveWithRejection_EndToEnd() { }

    [Fact]
    public async Task Scenario4_IdempotentRetry_NoDuplicateReceipt()
    {
        var options = new DbContextOptionsBuilder<WMSDbContext>()
            .UseInMemoryDatabase(databaseName: $"wms-scenario4-{Guid.NewGuid():N}")
            .Options;

        await using var dbContext = new WMSDbContext(options);
        var consumer = new ShipmentSortedConsumer(dbContext, NullLogger<ShipmentSortedConsumer>.Instance);
        var orderId = Guid.NewGuid();

        var message = new ShipmentSortedIntegrationEvent(
            orderId,
            Guid.NewGuid().ToString(),
            DateTime.UtcNow,
            "tenant-sc4",
            "operator-sub-1",
            "ASN-SC4-001");

        var contextMock = new Mock<ConsumeContext<ShipmentSortedIntegrationEvent>>();
        contextMock.Setup(x => x.Message).Returns(message);
        contextMock.Setup(x => x.CancellationToken).Returns(CancellationToken.None);

        await consumer.Consume(contextMock.Object);
        await consumer.Consume(contextMock.Object);

        var count = await dbContext.InboundReceipts
            .Where(x => x.SourceRef == orderId.ToString() && x.TenantId == "tenant-sc4")
            .CountAsync();

        Assert.Equal(1, count);
    }

    [Fact]
    public void Scenario5_QaDisposition_SoftLinkToInboundLine()
    {
        var wh = Guid.NewGuid();
        var bin = Guid.NewGuid();
        var item = InventoryItem.Create("SKU-QA", 5, "t1", "c1", wh, bin);
        var lineId = Guid.NewGuid();
        var log = item.ChangeStatus(
            InventoryStatus.Quarantined,
            DispositionStatus.QuarantineEnter,
            inboundLineId: lineId,
            notes: "QA sample");

        Assert.NotNull(log);
        Assert.Equal(lineId, log!.InboundLineId);
    }
}
