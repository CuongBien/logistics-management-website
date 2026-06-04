using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Logistics.Core;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Infrastructure.Persistence;

public static class WMSDbContextSeed
{
    public static async Task SeedAsync(WMSDbContext context, ILogger logger)
    {
        try
        {
            // Clean WMS transactional tables on every startup for fresh seed
            try
            {
                logger.LogInformation("Cleaning WMS transactional tables for fresh seed...");
                await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"ShipmentItems\", \"ShipmentOrders\", \"Shipments\", \"OutboundOrderLines\", \"OutboundOrders\", \"InboundReceiptLines\", \"InboundReceipts\", \"InventoryItems\", \"PickTasks\", \"PutawayTasks\", \"ReplenishmentTasks\", \"CountTasks\", \"CrossDockTasks\", \"InboundDiscrepancies\", \"TransitDiscrepancies\" CASCADE;");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not truncate transactional tables.");
            }

            // Seed standard WMS Roles if not present
            if (!await context.Roles.AnyAsync(r => r.Code == "WMS_ADMIN"))
            {
                logger.LogInformation("Seeding standard WMS Roles...");
                var adminRole = new Role("WMS_ADMIN", "WMS Administrator");
                var supervisorRole = new Role("WMS_SUPERVISOR", "WMS Supervisor");
                var operatorRole = new Role("WMS_OPERATOR", "WMS Operator / Staff");
                context.Roles.AddRange(adminRole, supervisorRole, operatorRole);
                await context.SaveChangesAsync();
            }

            // Link permissions to standard roles if missing
            var allPermissions = await context.Permissions.ToListAsync();
            
            var adminRoleEntity = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Code == "WMS_ADMIN");
            if (adminRoleEntity != null)
            {
                foreach (var perm in allPermissions)
                {
                    adminRoleEntity.AddPermission(perm);
                }
            }

            var supervisorRoleEntity = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Code == "WMS_SUPERVISOR");
            if (supervisorRoleEntity != null)
            {
                foreach (var perm in allPermissions)
                {
                    if (perm.Code != "role:manage")
                    {
                        supervisorRoleEntity.AddPermission(perm);
                    }
                }
            }

            var operatorRoleEntity = await context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Code == "WMS_OPERATOR");
            if (operatorRoleEntity != null)
            {
                var operatorCodes = new HashSet<string>
                {
                    "inbound:receive",
                    "inbound:putaway",
                    "inbound:transit_receive",
                    "outbound:pick",
                    "outbound:pack",
                    "outbound:load",
                    "inventory:transfer",
                    "inventory:count",
                    "inventory:replenish",
                    "crossdock:execute"
                };
                foreach (var perm in allPermissions)
                {
                    if (operatorCodes.Contains(perm.Code))
                    {
                        operatorRoleEntity.AddPermission(perm);
                    }
                }
            }

            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully linked standard permissions to WMS roles.");
            }


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
                    logger.LogInformation("Cleaning WMS layout tables for fresh seed...");
                    await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Bins\", \"Zones\", \"Blocks\" CASCADE;");
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Could not truncate layout tables, proceeding.");
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

                        // Add Staging Block, Zone and Bins for Cross-Docking and Inbound/Outbound
                        var stagingBlock = new Block(wh.Id, "BLK-STAGING");
                        wh.AddBlock(stagingBlock);
                        context.Blocks.Add(stagingBlock);
                        var stagingZone = new Zone(stagingBlock.Id, ZoneType.Staging);
                        context.Zones.Add(stagingZone);
                        await context.SaveChangesAsync();

                        var dockBin = new Bin(wh.Id, stagingZone.Id, "BIN-DOCK-01", BinStatus.Available, "DOCK", "1", "01", currentSequence++);
                        context.Bins.Add(dockBin);

                        var stagingOutBin = new Bin(wh.Id, stagingZone.Id, "BIN-STAGING-OUT-01", BinStatus.Available, "STG-OUT", "1", "01", currentSequence++);
                        context.Bins.Add(stagingOutBin);
                        await context.SaveChangesAsync();

                        // Seed Wall Bins (WALL-A-01 to WALL-A-10) for Put-to-Wall sorting
                        for (int i = 1; i <= 10; i++)
                        {
                            string wallBinCode = $"WALL-A-{i:D2}";
                            var wallBin = new Bin(wh.Id, stagingZone.Id, wallBinCode, BinStatus.Available, "WALL", "A", i.ToString("D2"), 900 + i);
                            context.Bins.Add(wallBin);
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

            // 4. Seed ERP SKU Mirrors (so SKUs are recognized and not treated as Unknown)
            if (!await context.ErpSkuMirrors.AnyAsync())
            {
                logger.LogInformation("Seeding ERP SKU Mirrors...");
                var now = DateTime.UtcNow;
                var skus = new[]
                {
                    ErpSkuMirror.Create("default-tenant", "erp-A0-001", "A0-001", "Ao Thun Nam Basic", "PCS", "active", now, now),
                    ErpSkuMirror.Create("default-tenant", "erp-A0-002", "A0-002", "Ao Thun Nu Basic", "PCS", "active", now, now),
                    ErpSkuMirror.Create("default-tenant", "erp-A0-003", "A0-003", "Ao Khoac Nam", "PCS", "active", now, now),
                    ErpSkuMirror.Create("default-tenant", "erp-SKU-RED-TSHIRT", "SKU-RED-TSHIRT", "Red T-Shirt", "PCS", "active", now, now),
                    ErpSkuMirror.Create("default-tenant", "erp-SKU-BLUE-JEANS", "SKU-BLUE-JEANS", "Blue Jeans", "PCS", "active", now, now),
                };
                context.ErpSkuMirrors.AddRange(skus);
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded {Count} ERP SKU Mirrors.", skus.Length);
            }

            if (!await context.ErpSkuMirrors.AnyAsync(s => s.SkuCode == "SKU-001"))
            {
                var sku = ErpSkuMirror.Create("default-tenant", "erp-SKU-001", "SKU-001", "Test Product 001", "PCS", "active", DateTime.UtcNow, DateTime.UtcNow);
                context.ErpSkuMirrors.Add(sku);
            }

            // 5. Seed Real Stock for HCM Warehouse (for Outbound/Pick testing)
            var binRedTshirt = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-A01-01" && b.WarehouseId == sgId);
            var binBlueJeans = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-A01-02" && b.WarehouseId == sgId);

            if (binRedTshirt != null && !await context.InventoryItems.AnyAsync(i => i.Sku == "SKU-RED-TSHIRT" && i.WarehouseId == sgId))
            {
                var invRed = InventoryItem.Create("SKU-RED-TSHIRT", 500, "default-tenant", "cust-default", sgId, binRedTshirt.Id, "LOT2026-01", null);
                context.InventoryItems.Add(invRed);
            }

            if (binBlueJeans != null && !await context.InventoryItems.AnyAsync(i => i.Sku == "SKU-BLUE-JEANS" && i.WarehouseId == sgId))
            {
                var invBlue = InventoryItem.Create("SKU-BLUE-JEANS", 200, "default-tenant", "cust-default", sgId, binBlueJeans.Id, "LOT2026-02", null);
                context.InventoryItems.Add(invBlue);
            }

            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded Real Stock for Outbound E2E Testing in HCMC Mega Hub.");
            }

            // 6. Seed Inbound Receipts
            if (!await context.InboundReceipts.AnyAsync())
            {
                logger.LogInformation("Seeding Inbound Receipts...");
                var receipt1 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "cust-default", sgId, "REC-2026-0001", null);
                receipt1.AddLine(new InboundReceiptLine(receipt1.Id, "default-tenant", "cust-default", "SKU-RED-TSHIRT", 100));
                receipt1.AddLine(new InboundReceiptLine(receipt1.Id, "default-tenant", "cust-default", "SKU-BLUE-JEANS", 50));

                var receipt2 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "cust-default", sgId, "REC-2026-0002", null);
                receipt2.AddLine(new InboundReceiptLine(receipt2.Id, "default-tenant", "cust-default", "SKU-RED-TSHIRT", 200));
                
                var receipt3 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "cust-default", sgId, "REC-2026-0003", null);
                receipt3.AddLine(new InboundReceiptLine(receipt3.Id, "default-tenant", "cust-default", "A0-001", 150));

                context.InboundReceipts.AddRange(receipt1, receipt2, receipt3);
                await context.SaveChangesAsync();
            }

            // 7. Seed Outbound Orders
            if (!await context.OutboundOrders.AnyAsync())
            {
                logger.LogInformation("Seeding Outbound Orders...");
                var order1 = new OutboundOrder(Guid.NewGuid(), "default-tenant", "cust-default", sgId, "OUT-2026-0001", "123 Main St", "HCMC");
                order1.AddLine("SKU-RED-TSHIRT", 10, "PCS");
                order1.AddLine("SKU-BLUE-JEANS", 5, "PCS");

                var order2 = new OutboundOrder(Guid.NewGuid(), "default-tenant", "cust-default", sgId, "OUT-2026-0002", "456 Elm St", "HCMC");
                order2.AddLine("A0-001", 20, "PCS");

                var order3 = new OutboundOrder(Guid.NewGuid(), "default-tenant", "cust-default", sgId, "OUT-2026-0003", "789 Pine St", "Hanoi");
                order3.AddLine("SKU-RED-TSHIRT", 50, "PCS");

                context.OutboundOrders.AddRange(order1, order2, order3);
                await context.SaveChangesAsync();
            }

            // 8. Seed Tasks (Putaway, Replenishment, Cycle Count)
            if (!await context.PutawayTasks.AnyAsync())
            {
                logger.LogInformation("Seeding Putaway Tasks...");
                var putawayBinRedTshirt = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-A01-01" && b.WarehouseId == sgId);
                var dockBin = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-DOCK-01" && b.WarehouseId == sgId);
                var receipt = await context.InboundReceipts.FirstOrDefaultAsync();
                if (putawayBinRedTshirt != null && dockBin != null && receipt != null)
                {
                    context.PutawayTasks.AddRange(
                        new PutawayTask("default-tenant", sgId, receipt.Id, "SKU-RED-TSHIRT", null, 50, dockBin.Id, putawayBinRedTshirt.Id),
                        new PutawayTask("default-tenant", sgId, receipt.Id, "A0-001", null, 100, dockBin.Id, putawayBinRedTshirt.Id)
                    );
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.ReplenishmentTasks.AnyAsync())
            {
                logger.LogInformation("Seeding Replenishment Tasks...");
                var binBulk = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-C01-01" && b.WarehouseId == sgId);
                var binPick = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-A01-01" && b.WarehouseId == sgId);
                if (binBulk != null && binPick != null)
                {
                    context.ReplenishmentTasks.AddRange(
                        new ReplenishmentTask("default-tenant", sgId, "SKU-RED-TSHIRT", binBulk.Id, binPick.Id, 100),
                        new ReplenishmentTask("default-tenant", sgId, "SKU-BLUE-JEANS", binBulk.Id, binPick.Id, 50)
                    );
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.CountTasks.AnyAsync())
            {
                logger.LogInformation("Seeding Cycle Count Tasks...");
                var countBinRedTshirt = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-A01-01" && b.WarehouseId == sgId);
                if (countBinRedTshirt != null)
                {
                    context.CountTasks.AddRange(
                        new CountTask("default-tenant", sgId, countBinRedTshirt.Id, "SKU-RED-TSHIRT", null, null, 500),
                        new CountTask("default-tenant", sgId, countBinRedTshirt.Id, "A0-001", null, null, 150)
                    );
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.CrossDockTasks.AnyAsync())
            {
                logger.LogInformation("Seeding Cross-Dock Tasks...");
                var inboundStagingBin = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-DOCK-01" && b.WarehouseId == sgId);
                var outboundStagingBin = await context.Bins.FirstOrDefaultAsync(b => b.BinCode == "BIN-A01-02" && b.WarehouseId == sgId);
                var receipt = await context.InboundReceipts.FirstOrDefaultAsync();
                var outboundOrder = await context.OutboundOrders.FirstOrDefaultAsync();

                if (inboundStagingBin != null && outboundStagingBin != null && receipt != null && outboundOrder != null)
                {
                    var task1 = new CrossDockTask(
                        "default-tenant",
                        sgId,
                        receipt.Id,
                        outboundOrder.Id,
                        "SKU-RED-TSHIRT",
                        20,
                        inboundStagingBin.Id,
                        outboundStagingBin.Id
                    );
                    
                    var task2 = new CrossDockTask(
                        "default-tenant",
                        sgId,
                        receipt.Id,
                        outboundOrder.Id,
                        "SKU-BLUE-JEANS",
                        5,
                        inboundStagingBin.Id,
                        outboundStagingBin.Id
                    );

                    context.CrossDockTasks.AddRange(task1, task2);
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.InboundDiscrepancies.AnyAsync())
            {
                logger.LogInformation("Seeding Inbound Discrepancies...");
                var receipt = await context.InboundReceipts.FirstOrDefaultAsync();
                if (receipt != null)
                {
                    var discrepancy1 = new InboundDiscrepancy(
                        receipt.Id,
                        sgId,
                        "SKU-RED-TSHIRT",
                        100,
                        95,
                        "system",
                        "Missing 5 items in shipment box"
                    );

                    var discrepancy2 = new InboundDiscrepancy(
                        receipt.Id,
                        sgId,
                        "SKU-BLUE-JEANS",
                        50,
                        48,
                        "system",
                        "2 items damaged during unloading"
                    );

                    context.InboundDiscrepancies.AddRange(discrepancy1, discrepancy2);
                    await context.SaveChangesAsync();
                }
            }

            if (!await context.TransitDiscrepancies.AnyAsync())
            {
                logger.LogInformation("Seeding Transit Discrepancies...");
                var order = await context.OutboundOrders.FirstOrDefaultAsync();
                if (order != null)
                {
                    var discrepancy = new TransitDiscrepancy(
                        order.Id,
                        Guid.NewGuid(),
                        sgId,
                        "SKU-RED-TSHIRT",
                        10,
                        9,
                        "FastDelivery",
                        "system",
                        "1 item lost in transit between hubs"
                    );

                    context.TransitDiscrepancies.Add(discrepancy);
                    await context.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the Warehouse database.");
        }
    }
}
