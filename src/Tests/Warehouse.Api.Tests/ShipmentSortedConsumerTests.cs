using EventBus.Messages.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Warehouse.Application.Features.Inbound.Consumers;
using Warehouse.Infrastructure.Persistence;
using Xunit;

namespace Warehouse.Api.Tests;

public class ShipmentSortedConsumerTests
{
    [Fact]
    public async Task Consume_IsIdempotent_WhenSameEventReplayed()
    {
        var options = new DbContextOptionsBuilder<WMSDbContext>()
            .UseInMemoryDatabase(databaseName: $"wms-idempotency-{Guid.NewGuid():N}")
            .Options;

        await using var dbContext = new WMSDbContext(options);
        var consumer = new ShipmentSortedConsumer(dbContext, NullLogger<ShipmentSortedConsumer>.Instance);
        var orderId = Guid.NewGuid();

        var message = new ShipmentSortedIntegrationEvent(
            orderId,
            Guid.NewGuid().ToString(),
            DateTime.UtcNow,
            "tenant-a",
            "operator-sub-1",
            "ASN-TEST-001");

        var contextMock = new Mock<ConsumeContext<ShipmentSortedIntegrationEvent>>();
        contextMock.Setup(x => x.Message).Returns(message);
        contextMock.Setup(x => x.CancellationToken).Returns(CancellationToken.None);

        await consumer.Consume(contextMock.Object);
        await consumer.Consume(contextMock.Object);

        var receipts = await dbContext.InboundReceipts
            .Where(x => x.OrderId == orderId && x.TenantId == "tenant-a")
            .ToListAsync();

        Assert.Single(receipts);
        Assert.Equal("ASN-TEST-001", receipts[0].SourceShipmentNo);
    }
}
