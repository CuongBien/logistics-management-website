using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Infrastructure.Persistence;

namespace Warehouse.Api.Tests.Inbound;

/// <summary>Shared InMemory WMS seed for inbound command tests.</summary>
internal static class InboundTestFixtures
{
    public static WMSDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<WMSDbContext>()
            .UseInMemoryDatabase(databaseName: $"inbound-{Guid.NewGuid():N}")
            .Options;
        return new WMSDbContext(options);
    }

    /// <summary>Minimal warehouse hierarchy, SKU mirror, operator scope.</summary>
    public static (
        Warehouse.Domain.Entities.Warehouse Warehouse,
        Guid BinId,
        string BinCode) SeedReceiveInfrastructure(
        WMSDbContext ctx,
        string tenantId,
        string customerId,
        string operatorSub,
        string skuCode = "SKU-1")
    {
        var warehouse = new Warehouse.Domain.Entities.Warehouse("Inbound Test", "IB-TST", "test");
        ctx.Warehouses.Add(warehouse);
        var block = new Block(warehouse.Id, "B1");
        ctx.Blocks.Add(block);
        var zone = new Zone(block.Id, ZoneType.Storage);
        ctx.Zones.Add(zone);
        var bin = new Bin(warehouse.Id, zone.Id, "BIN-01");
        ctx.Bins.Add(bin);

        ctx.ErpSkuMirrors.Add(ErpSkuMirror.Create(
            tenantId,
            "erp-1",
            skuCode,
            skuCode,
            "EA",
            "active",
            DateTime.UtcNow,
            DateTime.UtcNow));

        var op = new OperatorProfile(tenantId, operatorSub, "Inbound tester");
        ctx.OperatorProfiles.Add(op);
        ctx.SaveChanges();

        ctx.OperatorWarehouseScopes.Add(new OperatorWarehouseScope(op.Id, warehouse.Id));
        ctx.SaveChanges();

        return (warehouse, bin.Id, bin.BinCode);
    }
}
