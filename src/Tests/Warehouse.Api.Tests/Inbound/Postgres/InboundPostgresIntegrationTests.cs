using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Xunit;

namespace Warehouse.Api.Tests.Inbound.Postgres;

[Collection(InboundPostgresCollection.Name)]
public sealed class InboundPostgresIntegrationTests
{
    private readonly InboundPostgresFixture _fixture;

    public InboundPostgresIntegrationTests(InboundPostgresFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task InboundReceipts_IdempotencyComposite_UniqueIndexEnforced()
    {
        await using var ctx = _fixture.CreateDbContext();

        var warehouse = new Warehouse.Domain.Entities.Warehouse("PG WH", "PGWH", "pg");
        ctx.Warehouses.Add(warehouse);
        await ctx.SaveChangesAsync();

        var tenant = "t-pg";
        var customer = "c-pg";
        var sourceRef = Guid.NewGuid().ToString();
        const string shipmentNo = "SHIP-PG-1";
        const string sourceType = "PURCHASE_ORDER";

        var r1 = new InboundReceipt(tenant, customer, warehouse.Id, "RCV-PG-1", sourceType, sourceRef, shipmentNo);
        var r2 = new InboundReceipt(tenant, customer, warehouse.Id, "RCV-PG-2", sourceType, sourceRef, shipmentNo);
        ctx.InboundReceipts.Add(r1);
        await ctx.SaveChangesAsync();

        ctx.InboundReceipts.Add(r2);
        await Assert.ThrowsAnyAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
    }

    [Fact]
    public async Task DispositionLog_InboundLineId_SoftLink_AllowsMissingInboundLine()
    {
        await using var ctx = _fixture.CreateDbContext();

        var warehouse = new Warehouse.Domain.Entities.Warehouse("PG WH2", "PGWH2", "pg");
        ctx.Warehouses.Add(warehouse);

        var block = new Block(warehouse.Id, "B1");
        ctx.Blocks.Add(block);
        var zone = new Zone(block.Id, ZoneType.Storage);
        ctx.Zones.Add(zone);
        var bin = new Bin(warehouse.Id, zone.Id, "BIN-01");
        ctx.Bins.Add(bin);

        var item = InventoryItem.Create("SKU-PG", 1, "t1", "c1", warehouse.Id, bin.Id);
        ctx.InventoryItems.Add(item);
        await ctx.SaveChangesAsync();

        // No corresponding InboundReceiptLine row exists for this Id.
        var missingInboundLineId = Guid.NewGuid();
        var log = new DispositionLog(item.Id, InventoryStatus.Quarantined, DispositionStatus.QuarantineEnter, missingInboundLineId, "qa");
        ctx.DispositionLogs.Add(log);

        await ctx.SaveChangesAsync();

        var persisted = await ctx.DispositionLogs.SingleAsync(x => x.Id == log.Id);
        Assert.Equal(missingInboundLineId, persisted.InboundLineId);
    }
}

