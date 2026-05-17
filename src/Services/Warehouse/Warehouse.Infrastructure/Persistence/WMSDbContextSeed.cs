using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Infrastructure.Persistence;

public static class WMSDbContextSeed
{
    public static async Task SeedAsync(WMSDbContext context, ILogger logger)
    {
        try
        {
            // 1. Seed Warehouses
            var ctId = Guid.Parse("b61a8f61-5238-4a18-809c-335cc293a025"); // Can Tho (Matching default Postman ID!)
            var sgId = Guid.Parse("a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"); // HCM
            var ntId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"); // Nha Trang
            var dnId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3"); // Da Nang
            var vId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4"); // Vinh
            var hnId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5"); // Hanoi
            var hpId = Guid.Parse("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6"); // Hai Phong

            if (!await context.Warehouses.AnyAsync(w => w.Code == "WH-SG-002"))
            {
                logger.LogInformation("Seeding 7 Vietnam Warehouses in WMS...");
                
                try
                {
                    logger.LogInformation("Cleaning WMS transactional tables and layout for fresh seed...");
                    await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"ShipmentItems\", \"ShipmentOrders\", \"Shipments\", \"OutboundOrderLines\", \"OutboundOrders\", \"Bins\", \"Zones\", \"Blocks\" CASCADE;");
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Could not truncate some transactional tables, proceeding with normal delete.");
                }
                
                var oldCtWh = await context.Warehouses.FirstOrDefaultAsync(w => w.Id == ctId);
                if (oldCtWh != null)
                {
                    logger.LogInformation("Deleting existing temporary warehouse with ID b61a8f61-5238-4a18-809c-335cc293a025 to avoid primary key conflict.");
                    context.Warehouses.Remove(oldCtWh);
                    await context.SaveChangesAsync();
                }

                context.Warehouses.AddRange(
                    new Domain.Entities.Warehouse(ctId, "Can Tho Delivery Hub", "WH-CT-001", "99 Can Tho Ave, Can Tho City"),
                    new Domain.Entities.Warehouse(sgId, "HCM Mega Hub", "WH-SG-002", "120 Nguyen Van Linh, District 7, HCMC"),
                    new Domain.Entities.Warehouse(ntId, "Nha Trang Delivery Hub", "WH-NT-003", "45 Tran Phu, Nha Trang City"),
                    new Domain.Entities.Warehouse(dnId, "Da Nang Sorting Center", "WH-DN-004", "88 Nguyen Huu Tho, Da Nang City"),
                    new Domain.Entities.Warehouse(vId, "Vinh Delivery Hub", "WH-V-005", "12 Le Loi, Vinh City"),
                    new Domain.Entities.Warehouse(hnId, "Hanoi Mega Hub", "WH-HN-006", "10 Hoang Hoa Tham, Hanoi City"),
                    new Domain.Entities.Warehouse(hpId, "Hai Phong Delivery Hub", "WH-HP-007", "50 Lach Tray, Hai Phong City")
                );
                await context.SaveChangesAsync();

                // Seed a default Block, Zone, Bin for Can Tho Delivery Hub to avoid empty layouts
                var wh = await context.Warehouses.FirstAsync(w => w.Id == ctId);
                var block = new Block(wh.Id, "BLK-A");
                wh.AddBlock(block);
                context.Blocks.Add(block);
                await context.SaveChangesAsync();

                var zone = new Zone(block.Id, 0); // Zone 0 = Standard
                context.Zones.Add(zone);
                await context.SaveChangesAsync();

                var bin = new Bin(wh.Id, zone.Id, "BIN-A1-01");
                context.Bins.Add(bin);
                await context.SaveChangesAsync();
                
                logger.LogInformation("Updating existing inventory items to point to the new BinId {BinId}", bin.Id);
                await context.Database.ExecuteSqlRawAsync($"UPDATE \"InventoryItems\" SET \"BinId\" = '{bin.Id}' WHERE \"WarehouseId\" = '{ctId}';");
                
                logger.LogInformation("Successfully configured base warehouse layout for Can Tho Delivery Hub.");
            }

            // 2. Seed WarehouseRoutes for Hub-and-Spoke next-hop calculations
            if (!await context.WarehouseRoutes.AnyAsync())
            {
                logger.LogInformation("Seeding Warehouse Routes...");
                
                // Route 1: Can Tho -> Hai Phong. Hops: HCM, Hanoi, Hai Phong
                var route1Hops = $"{sgId},{hnId},{hpId}";
                // Route 2: Can Tho -> Hanoi. Hops: HCM, Hanoi
                var route2Hops = $"{sgId},{hnId}";
                // Route 3: Can Tho -> Vinh. Hops: HCM, Da Nang, Vinh
                var route3Hops = $"{sgId},{dnId},{vId}";
                // Route 4: Nha Trang -> Hai Phong. Hops: Da Nang, Hanoi, Hai Phong
                var route4Hops = $"{dnId},{hnId},{hpId}";

                context.WarehouseRoutes.AddRange(
                    new WarehouseRoute(ctId, hpId, route1Hops),
                    new WarehouseRoute(ctId, hnId, route2Hops),
                    new WarehouseRoute(ctId, vId, route3Hops),
                    new WarehouseRoute(ntId, hpId, route4Hops)
                );

                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded default Warehouse Routes.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the Warehouse database.");
        }
    }
}
