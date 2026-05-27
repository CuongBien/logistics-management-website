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

                // Seed a default Block, Zone, Bin for ALL warehouses to avoid empty layouts
                var allWarehouseIds = new[] { ctId, sgId, ntId, dnId, vId, hnId, hpId };
                foreach (var whId in allWarehouseIds)
                {
                    var wh = await context.Warehouses.FirstAsync(w => w.Id == whId);
                    var block = new Block(wh.Id, "BLK-A");
                    wh.AddBlock(block);
                    context.Blocks.Add(block);
                    await context.SaveChangesAsync();

                    var zone = new Zone(block.Id, ZoneType.Picking); // Updated enum usage
                    context.Zones.Add(zone);
                    await context.SaveChangesAsync();

                    var bin = new Bin(wh.Id, zone.Id, "BIN-A1-01", BinStatus.Available, "A", "1", "01", 1);
                    context.Bins.Add(bin);
                    await context.SaveChangesAsync();

                    var binReturn = new Bin(wh.Id, zone.Id, "BIN-RETURN", BinStatus.Available, "RET", "1", "1", 9999);
                    context.Bins.Add(binReturn);
                    await context.SaveChangesAsync();

                    var binScrap = new Bin(wh.Id, zone.Id, "BIN-SCRAP", BinStatus.Available, "SCR", "1", "1", 9999);
                    context.Bins.Add(binScrap);
                    await context.SaveChangesAsync();

                    if (whId == ctId)
                    {
                        var binCt = new Bin(wh.Id, zone.Id, "BIN-CT-001", BinStatus.Available, "A", "1", "02", 2);
                        context.Bins.Add(binCt);
                        await context.SaveChangesAsync();

                        logger.LogInformation("Updating existing inventory items to point to the new BinId {BinId}", bin.Id);
                        await context.Database.ExecuteSqlRawAsync($"UPDATE \"InventoryItems\" SET \"BinId\" = '{bin.Id}' WHERE \"WarehouseId\" = '{ctId}';");
                    }

                    if (whId == hpId)
                    {
                        var binHpStore = new Bin(wh.Id, zone.Id, "BIN-A1-02", BinStatus.Available, "A", "1", "02", 2);
                        context.Bins.Add(binHpStore);
                        await context.SaveChangesAsync();
                    }

                    // Seed realistic layout for HCM Warehouse (sgId)
                    if (whId == sgId)
                    {
                        logger.LogInformation("Seeding realistic warehouse layout for HCM Hub...");
                        var aisles = new[] { "A", "B", "C", "D" };
                        int currentSequence = 10;
                        var bulkZones = new List<Zone>();

                        // Thêm 1 Block và Zone mới cho Bulk Storage
                        var bulkBlock = new Block(wh.Id, "BLK-BULK");
                        wh.AddBlock(bulkBlock);
                        context.Blocks.Add(bulkBlock);
                        var bulkZone = new Zone(bulkBlock.Id, ZoneType.Storage);
                        context.Zones.Add(bulkZone);
                        await context.SaveChangesAsync();

                        foreach (var aisle in aisles)
                        {
                            for (int rack = 1; rack <= 5; rack++) // 5 Racks per Aisle
                            {
                                for (int shelf = 1; shelf <= 3; shelf++) // 3 Shelves per Rack
                                {
                                    string rackStr = rack.ToString("D2");
                                    string shelfStr = shelf.ToString("D2");
                                    string binCode = $"BIN-{aisle}{rackStr}-{shelfStr}";
                                    
                                    // Bins ở Aisle A, B dùng làm Pick (Zone hiện tại), C, D dùng làm Bulk
                                    var targetZoneId = (aisle == "A" || aisle == "B") ? zone.Id : bulkZone.Id;

                                    var gridBin = new Bin(wh.Id, targetZoneId, binCode, BinStatus.Available, aisle, rackStr, shelfStr, currentSequence++);
                                    context.Bins.Add(gridBin);
                                }
                            }
                        }
                        await context.SaveChangesAsync();
                    }
                }
                
                logger.LogInformation("Successfully configured base warehouse layouts for all 7 warehouses.");
            }

            // 2. Seed WarehouseRoutes for Hub-and-Spoke next-hop calculations
            if (!await context.WarehouseRoutes.AnyAsync())
            {
                logger.LogInformation("Seeding Warehouse Routes (Next-Hop Matrix)...");

                context.WarehouseRoutes.AddRange(
                    new WarehouseRoute(ctId, hpId, sgId), // Can Tho -> Hai Phong. Next Hop = HCM
                    new WarehouseRoute(ctId, hnId, sgId), // Can Tho -> Hanoi. Next Hop = HCM
                    new WarehouseRoute(ctId, vId, sgId),  // Can Tho -> Vinh. Next Hop = HCM
                    new WarehouseRoute(ntId, hpId, dnId), // Nha Trang -> Hai Phong. Next Hop = Da Nang
                    new WarehouseRoute(sgId, hpId, hnId), // HCM -> Hai Phong. Next Hop = Hanoi
                    new WarehouseRoute(sgId, hnId, hnId), // HCM -> Hanoi. Next Hop = Hanoi
                    new WarehouseRoute(hnId, hpId, hpId)  // Hanoi -> Hai Phong. Next Hop = Hai Phong (Direct)
                );

                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded default Warehouse Routes Next-Hop Matrix.");
            }

            // 3. Ensure BIN-RETURN and BIN-SCRAP exists for all warehouses
            var existingWarehouses = await context.Warehouses.ToListAsync();
            foreach (var wh in existingWarehouses)
            {
                var zone = await context.Zones.FirstOrDefaultAsync(z => z.Block.WarehouseId == wh.Id);
                if (zone != null)
                {
                    var returnBinExists = await context.Bins.AnyAsync(b => b.WarehouseId == wh.Id && b.BinCode == "BIN-RETURN");
                    if (!returnBinExists)
                    {
                        var binReturn = new Bin(wh.Id, zone.Id, "BIN-RETURN");
                        context.Bins.Add(binReturn);
                        logger.LogInformation("Seeded missing BIN-RETURN for warehouse {WarehouseCode}", wh.Code);
                    }

                    var scrapBinExists = await context.Bins.AnyAsync(b => b.WarehouseId == wh.Id && b.BinCode == "BIN-SCRAP");
                    if (!scrapBinExists)
                    {
                        var binScrap = new Bin(wh.Id, zone.Id, "BIN-SCRAP");
                        context.Bins.Add(binScrap);
                        logger.LogInformation("Seeded missing BIN-SCRAP for warehouse {WarehouseCode}", wh.Code);
                    }
                }
            }
            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the Warehouse database.");
        }
    }
}
