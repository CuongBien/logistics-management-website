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
            // Check if data already exists to avoid truncating and re-seeding
            if (await context.Bins.AnyAsync() || await context.OperatorActivityLogs.AnyAsync())
            {
                logger.LogInformation("Data already exists. Skipping truncation and re-seeding.");
                
                // Seed WarehouseRoutes if they are missing or incomplete
                if (await context.WarehouseRoutes.CountAsync() < 42)
                {
                    logger.LogInformation("WarehouseRoutes table is incomplete. Re-seeding routes independently.");
                    var existingRoutes = await context.WarehouseRoutes.ToListAsync();
                    context.WarehouseRoutes.RemoveRange(existingRoutes);
                    await context.SaveChangesAsync();
                    
                    await SeedWarehouseRoutesOnlyAsync(context, logger);
                }
                
                return;
            }

            // Clean WMS transactional and layout tables on every startup for fresh seed
            try
            {
                logger.LogInformation("Cleaning WMS layout and transactional tables for fresh seed...");
                await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"ShipmentItems\", \"ShipmentOrders\", \"Shipments\", \"OutboundOrderLines\", \"OutboundOrders\", \"OutboundReturns\", \"InboundReceiptLines\", \"InboundReceipts\", \"InboundBinAllocations\", \"InventoryItems\", \"inventory_reservations\", \"InventoryLedgers\", \"InventoryReconciliationReports\", \"Waves\", \"PickTasks\", \"PutawayTasks\", \"ReplenishmentTasks\", \"CountTasks\", \"CrossDockTasks\", \"PackVerifications\", \"InboundDiscrepancies\", \"TransitDiscrepancies\", \"Notifications\", \"OperatorActivityLogs\" CASCADE;");
                await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Bins\", \"Zones\", \"Blocks\", \"WarehouseRoutes\", \"OperatorRoleAssignments\" CASCADE;");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not truncate layout and transactional tables.");
            }

            // Seed standard WMS Roles if not present
            if (!await context.Roles.AnyAsync(r => r.Code == "WMS_ADMIN"))
            {
                logger.LogInformation("Seeding standard WMS Roles...");
                var roleAdmin = new Role("WMS_ADMIN", "WMS Administrator");
                var roleSupervisor = new Role("WMS_SUPERVISOR", "WMS Supervisor");
                var roleOperator = new Role("WMS_OPERATOR", "WMS Operator / Staff");
                context.Roles.AddRange(roleAdmin, roleSupervisor, roleOperator);
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

            var allWarehouseIds = new[] { ctId, sgId, ntId, dnId, vId, hnId, hpId };

            // Ensure our 7 warehouses exist in the database (keeping any other synced warehouses)
            var warehousesToSeed = new List<Domain.Entities.Warehouse>();
            if (!await context.Warehouses.AnyAsync(w => w.Id == ctId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(ctId, "Can Tho Delivery Hub", "WH-CT-001", "99 Can Tho Ave, Can Tho City"));
            if (!await context.Warehouses.AnyAsync(w => w.Id == sgId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(sgId, "HCM Mega Hub", "WH-SG-002", "120 Nguyen Van Linh, District 7, HCMC"));
            if (!await context.Warehouses.AnyAsync(w => w.Id == ntId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(ntId, "Nha Trang Delivery Hub", "WH-NT-003", "45 Tran Phu, Nha Trang City"));
            if (!await context.Warehouses.AnyAsync(w => w.Id == dnId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(dnId, "Da Nang Sorting Center", "WH-DN-004", "88 Nguyen Huu Tho, Da Nang City"));
            if (!await context.Warehouses.AnyAsync(w => w.Id == vId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(vId, "Vinh Delivery Hub", "WH-V-005", "12 Le Loi, Vinh City"));
            if (!await context.Warehouses.AnyAsync(w => w.Id == hnId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(hnId, "Hanoi Mega Hub", "WH-HN-006", "10 Hoang Hoa Tham, Hanoi City"));
            if (!await context.Warehouses.AnyAsync(w => w.Id == hpId))
                warehousesToSeed.Add(new Domain.Entities.Warehouse(hpId, "Hai Phong Delivery Hub", "WH-HP-007", "50 Lach Tray, Hai Phong City"));

            if (warehousesToSeed.Count > 0)
            {
                context.Warehouses.AddRange(warehousesToSeed);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded missing warehouses.");
            }

            // Seed layouts for all 7 warehouses
            foreach (var whId in allWarehouseIds)
            {
                var wh = await context.Warehouses.FirstAsync(w => w.Id == whId);
                var block = new Block(wh.Id, "BLK-A");
                wh.AddBlock(block);
                context.Blocks.Add(block);
                await context.SaveChangesAsync();

                var zone = new Zone(block.Id, ZoneType.Picking);
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

                // Standard bins for non-SG warehouses to support staging/docking and multiple picks
                if (whId != sgId)
                {
                    var binA2 = new Bin(wh.Id, zone.Id, "BIN-A1-02", BinStatus.Available, "A", "1", "02", 2);
                    context.Bins.Add(binA2);

                    var binDock = new Bin(wh.Id, zone.Id, "BIN-DOCK-01", BinStatus.Available, "DOCK", "1", "01", 3);
                    context.Bins.Add(binDock);
                    await context.SaveChangesAsync();
                }

                if (whId == ctId)
                {
                    var binCt = new Bin(wh.Id, zone.Id, "BIN-CT-001", BinStatus.Available, "A", "1", "03", 4);
                    context.Bins.Add(binCt);
                    await context.SaveChangesAsync();
                }

                // Seed detailed layout for HCM Warehouse (sgId)
                if (whId == sgId)
                {
                    logger.LogInformation("Seeding realistic warehouse layout for HCM Hub...");
                    var aisles = new[] { "A", "B", "C", "D" };
                    int currentSequence = 10;

                    // Add a Bulk Storage block and zone
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

            // 2. Seed WarehouseRoutes for Hub-and-Spoke next-hop calculations
            await SeedWarehouseRoutesOnlyAsync(context, logger);

            // 3. Ensure BIN-RETURN and BIN-SCRAP exist for all warehouses (just in case)
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
                    }

                    var scrapBinExists = await context.Bins.AnyAsync(b => b.WarehouseId == wh.Id && b.BinCode == "BIN-SCRAP");
                    if (!scrapBinExists)
                    {
                        var binScrap = new Bin(wh.Id, zone.Id, "BIN-SCRAP");
                        context.Bins.Add(binScrap);
                    }
                }
            }
            await context.SaveChangesAsync();

            // 4. Seed ERP SKU Mirrors (so SKUs are recognized)
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
                logger.LogInformation("Successfully seeded ERP SKU Mirrors.");
            }

            if (!await context.ErpSkuMirrors.AnyAsync(s => s.SkuCode == "SKU-001"))
            {
                var sku = ErpSkuMirror.Create("default-tenant", "erp-SKU-001", "SKU-001", "Test Product 001", "PCS", "active", DateTime.UtcNow, DateTime.UtcNow);
                context.ErpSkuMirrors.Add(sku);
                await context.SaveChangesAsync();
            }

            // 5. Seed Real Stock and Transactional Data for ALL Warehouses
            var activeWarehouses = await context.Warehouses.Where(w => allWarehouseIds.Contains(w.Id)).ToListAsync();
            foreach (var wh in activeWarehouses)
            {
                var whId = wh.Id;
                
                var pickBin1 = await context.Bins.FirstOrDefaultAsync(b => b.WarehouseId == whId && (b.BinCode == "BIN-A01-01" || b.BinCode == "BIN-A1-01"));
                var pickBin2 = await context.Bins.FirstOrDefaultAsync(b => b.WarehouseId == whId && (b.BinCode == "BIN-A01-02" || b.BinCode == "BIN-A1-02"));
                var dockBin = await context.Bins.FirstOrDefaultAsync(b => b.WarehouseId == whId && b.BinCode == "BIN-DOCK-01");
                
                if (pickBin1 == null || pickBin2 == null || dockBin == null)
                {
                    logger.LogWarning("Skipping seeding transactional data for warehouse {WarehouseCode} because bins were not found.", wh.Code);
                    continue;
                }
                
                // Seed InventoryItems (Real Stock)
                var invRed = InventoryItem.Create("SKU-RED-TSHIRT", 500, "default-tenant", "cust-default", whId, pickBin1.Id, "LOT2026-01", null);
                var invBlue = InventoryItem.Create("SKU-BLUE-JEANS", 200, "default-tenant", "cust-default", whId, pickBin2.Id, "LOT2026-02", null);
                
                var invRedCust1 = InventoryItem.Create("SKU-RED-TSHIRT", 300, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, pickBin1.Id, "LOT2026-C1-01", null);
                var invBlueCust1 = InventoryItem.Create("SKU-BLUE-JEANS", 150, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, pickBin2.Id, "LOT2026-C1-02", null);
                
                context.InventoryItems.AddRange(invRed, invBlue, invRedCust1, invBlueCust1);
                await context.SaveChangesAsync();
                
                // Seed Inventory Ledgers (with one mismatch for testing Reconciliation)
                int balanceRed = 500;
                if (whId == sgId) balanceRed = 480; // Intentional discrepancy of 20 in SG
                var ledgerRed = InventoryLedger.Create(invRed, InventoryLedgerReason.InboundReceived, 500, null, null, "system", null, balanceRed);
                var ledgerBlue = InventoryLedger.Create(invBlue, InventoryLedgerReason.InboundReceived, 200, null, null, "system", null, 200);
                var ledgerRedC1 = InventoryLedger.Create(invRedCust1, InventoryLedgerReason.InboundReceived, 300, null, null, "system", null, 300);
                var ledgerBlueC1 = InventoryLedger.Create(invBlueCust1, InventoryLedgerReason.InboundReceived, 150, null, null, "system", null, 150);
                
                context.InventoryLedgers.AddRange(ledgerRed, ledgerBlue, ledgerRedC1, ledgerBlueC1);
                await context.SaveChangesAsync();
                
                // Seed Inbound Receipts
                var receipt1 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "cust-default", whId, $"REC-{wh.Code}-0001", null);
                receipt1.AddLine(new InboundReceiptLine(receipt1.Id, "default-tenant", "cust-default", "SKU-RED-TSHIRT", 100));
                receipt1.AddLine(new InboundReceiptLine(receipt1.Id, "default-tenant", "cust-default", "SKU-BLUE-JEANS", 50));
                
                var receipt2 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "cust-default", whId, $"REC-{wh.Code}-0002", null);
                receipt2.AddLine(new InboundReceiptLine(receipt2.Id, "default-tenant", "cust-default", "SKU-RED-TSHIRT", 200));
                
                var receipt3 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "cust-default", whId, $"REC-{wh.Code}-0003", null);
                receipt3.AddLine(new InboundReceiptLine(receipt3.Id, "default-tenant", "cust-default", "A0-001", 150));

                var receiptCust1_1 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, $"REC-{wh.Code}-CUST1-0001", null);
                receiptCust1_1.AddLine(new InboundReceiptLine(receiptCust1_1.Id, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", "SKU-RED-TSHIRT", 150));
                receiptCust1_1.AddLine(new InboundReceiptLine(receiptCust1_1.Id, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", "SKU-BLUE-JEANS", 50));
                
                var receiptCust1_2 = new InboundReceipt(Guid.NewGuid(), "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, $"REC-{wh.Code}-CUST1-0002", null);
                receiptCust1_2.AddLine(new InboundReceiptLine(receiptCust1_2.Id, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", "SKU-RED-TSHIRT", 100));

                context.InboundReceipts.AddRange(receipt1, receipt2, receipt3, receiptCust1_1, receiptCust1_2);
                await context.SaveChangesAsync();
                
                // Seed Outbound Orders
                var order1 = new OutboundOrder(Guid.NewGuid(), "default-tenant", "cust-default", whId, $"OUT-{wh.Code}-0001", "123 Main St", wh.Name);
                order1.AddLine("SKU-RED-TSHIRT", 10, "PCS");
                order1.AddLine("SKU-BLUE-JEANS", 5, "PCS");
                
                var order2 = new OutboundOrder(Guid.NewGuid(), "default-tenant", "cust-default", whId, $"OUT-{wh.Code}-0002", "456 Elm St", wh.Name);
                order2.AddLine("A0-001", 20, "PCS");
                
                var order3 = new OutboundOrder(Guid.NewGuid(), "default-tenant", "cust-default", whId, $"OUT-{wh.Code}-0003", "789 Pine St", wh.Name);
                order3.AddLine("SKU-RED-TSHIRT", 50, "PCS");
                
                // Customer 1 Orders
                Guid orderC1_1_Id = whId == sgId ? Guid.Parse("d1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1") : Guid.NewGuid();
                Guid orderC1_2_Id = whId == sgId ? Guid.Parse("d2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2") : Guid.NewGuid();
                Guid orderC1_3_Id = whId == sgId ? Guid.Parse("d3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3") : Guid.NewGuid();

                var orderCust1_1 = new OutboundOrder(orderC1_1_Id, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, $"OUT-{wh.Code}-CUST1-0001", "789 Nguyen Hue", wh.Name);
                orderCust1_1.AddLine("SKU-RED-TSHIRT", 2, "PCS");
                orderCust1_1.AddLine("SKU-BLUE-JEANS", 1, "PCS");
                
                var orderCust1_2 = new OutboundOrder(orderC1_2_Id, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, $"OUT-{wh.Code}-CUST1-0002", "456 Le Loi", wh.Name);
                orderCust1_2.AddLine("SKU-RED-TSHIRT", 5, "PCS");

                var orderCust1_3 = new OutboundOrder(orderC1_3_Id, "default-tenant", "5107728a-5b22-49dd-a608-718ed99dbaeb", whId, $"OUT-{wh.Code}-CUST1-0003", "123 Tran Hung Dao", wh.Name);
                orderCust1_3.AddLine("SKU-BLUE-JEANS", 3, "PCS");

                context.OutboundOrders.AddRange(order1, order2, order3, orderCust1_1, orderCust1_2, orderCust1_3);
                await context.SaveChangesAsync();
                
                // Seed InventoryReservations to transition orders to Allocated
                var resRed = InventoryReservation.Create(invRedCust1.Id, orderCust1_1.Id.ToString(), ReservationType.OutboundOrder, 2, TimeSpan.FromDays(30));
                var resBlue = InventoryReservation.Create(invBlueCust1.Id, orderCust1_1.Id.ToString(), ReservationType.OutboundOrder, 1, TimeSpan.FromDays(30));
                context.InventoryReservations.AddRange(resRed, resBlue);
                orderCust1_1.UpdateStatus(OutboundOrderStatus.Allocated);
                
                var resRed2 = InventoryReservation.Create(invRedCust1.Id, orderCust1_2.Id.ToString(), ReservationType.OutboundOrder, 5, TimeSpan.FromDays(30));
                context.InventoryReservations.Add(resRed2);
                orderCust1_2.UpdateStatus(OutboundOrderStatus.Allocated);
                await context.SaveChangesAsync();
                
                // Seed Putaway Tasks
                context.PutawayTasks.AddRange(
                    new PutawayTask("default-tenant", whId, receipt1.Id, "SKU-RED-TSHIRT", null, 50, dockBin.Id, pickBin1.Id),
                    new PutawayTask("default-tenant", whId, receipt1.Id, "A0-001", null, 100, dockBin.Id, pickBin1.Id)
                );
                
                // Seed Replenishment Tasks
                var bulkBin = await context.Bins.FirstOrDefaultAsync(b => b.WarehouseId == whId && b.BinCode == "BIN-C01-01") ?? dockBin;
                context.ReplenishmentTasks.AddRange(
                    new ReplenishmentTask("default-tenant", whId, "SKU-RED-TSHIRT", bulkBin.Id, pickBin1.Id, 100),
                    new ReplenishmentTask("default-tenant", whId, "SKU-BLUE-JEANS", bulkBin.Id, pickBin2.Id, 50)
                );
                
                // Seed Cycle Count Tasks
                context.CountTasks.AddRange(
                    new CountTask("default-tenant", whId, pickBin1.Id, "SKU-RED-TSHIRT", null, null, 500),
                    new CountTask("default-tenant", whId, pickBin1.Id, "A0-001", null, null, 150)
                );
                
                // Seed Cross-Dock Tasks
                context.CrossDockTasks.AddRange(
                    new CrossDockTask("default-tenant", whId, receipt1.Id, order1.Id, "SKU-RED-TSHIRT", 20, dockBin.Id, pickBin2.Id),
                    new CrossDockTask("default-tenant", whId, receipt1.Id, order1.Id, "SKU-BLUE-JEANS", 5, dockBin.Id, pickBin2.Id)
                );
                
                // Seed Inbound Discrepancies
                context.InboundDiscrepancies.AddRange(
                    new InboundDiscrepancy(receipt1.Id, whId, "SKU-RED-TSHIRT", 100, 95, "system", "Missing 5 items in shipment box"),
                    new InboundDiscrepancy(receipt1.Id, whId, "SKU-BLUE-JEANS", 50, 48, "system", "2 items damaged during unloading")
                );
                
                // Seed Transit Discrepancies
                context.TransitDiscrepancies.Add(
                    new TransitDiscrepancy(order1.Id, Guid.NewGuid(), whId, "SKU-RED-TSHIRT", 10, 9, "FastDelivery", "system", "1 item lost in transit between hubs")
                );
                
                await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded transactional data for warehouse {WarehouseCode}.", wh.Code);
            }

            // 9. Seed Operator Profiles and Role Assignments for admin and staff1
            logger.LogInformation("Seeding Operator Profiles and Role Assignments in WMS...");

            var adminProfile = await context.OperatorProfiles.FirstOrDefaultAsync(p => p.OperatorSub == "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8");
            if (adminProfile == null)
            {
                adminProfile = new OperatorProfile("default-tenant", "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8", "System Admin");
                context.OperatorProfiles.Add(adminProfile);
                await context.SaveChangesAsync();
            }
            adminProfile.UpdatePersonalDetails("System Admin", "admin@shiphub.vn", "0987654321", "EMP-001");

            var staffProfile = await context.OperatorProfiles.FirstOrDefaultAsync(p => p.OperatorSub == "1a382041-9098-4351-ab71-d3939f8368dd");
            if (staffProfile == null)
            {
                staffProfile = new OperatorProfile("default-tenant", "1a382041-9098-4351-ab71-d3939f8368dd", "Nguyen Staff");
                context.OperatorProfiles.Add(staffProfile);
                await context.SaveChangesAsync();
            }
            staffProfile.UpdatePersonalDetails("Nguyen Staff", "staff1@shiphub.vn", "0912345678", "EMP-002");

            var managerProfile = await context.OperatorProfiles.FirstOrDefaultAsync(p => p.OperatorSub == "3b382041-9098-4351-ab71-d3939f8368de");
            if (managerProfile == null)
            {
                managerProfile = new OperatorProfile("default-tenant", "3b382041-9098-4351-ab71-d3939f8368de", "Nguyen Manager");
                context.OperatorProfiles.Add(managerProfile);
                await context.SaveChangesAsync();
            }
            managerProfile.UpdatePersonalDetails("Nguyen Manager", "manager1@shiphub.vn", "0909090909", "EMP-003");

            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "WMS_ADMIN");
            var supervisorRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "WMS_SUPERVISOR");
            var operatorRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "WMS_OPERATOR");

            if (adminRole != null && adminProfile != null)
            {
                var warehouses = await context.Warehouses.ToListAsync();
                foreach (var wh in warehouses)
                {
                    var exists = await context.OperatorRoleAssignments.AnyAsync(a => a.OperatorProfileId == adminProfile.Id && a.RoleId == adminRole.Id && a.WarehouseId == wh.Id);
                    if (!exists)
                    {
                        context.OperatorRoleAssignments.Add(new OperatorRoleAssignment(adminProfile.Id, adminRole.Id, wh.Id, null));
                    }
                }
            }

            if (supervisorRole != null && managerProfile != null)
            {
                var warehouses = await context.Warehouses.ToListAsync();
                foreach (var wh in warehouses)
                {
                    var exists = await context.OperatorRoleAssignments.AnyAsync(a => a.OperatorProfileId == managerProfile.Id && a.RoleId == supervisorRole.Id && a.WarehouseId == wh.Id);
                    if (!exists)
                    {
                        context.OperatorRoleAssignments.Add(new OperatorRoleAssignment(managerProfile.Id, supervisorRole.Id, wh.Id, null));
                    }
                }
            }

            if (operatorRole != null && staffProfile != null)
            {
                var warehouses = await context.Warehouses.ToListAsync();
                foreach (var wh in warehouses)
                {
                    var exists = await context.OperatorRoleAssignments.AnyAsync(a => a.OperatorProfileId == staffProfile.Id && a.RoleId == operatorRole.Id && a.WarehouseId == wh.Id);
                    if (!exists)
                    {
                        context.OperatorRoleAssignments.Add(new OperatorRoleAssignment(staffProfile.Id, operatorRole.Id, wh.Id, null));
                    }
                }
            }
            await context.SaveChangesAsync();

            // 10. Seed Operator Activity Logs (Historical logs over past 30 days)
            if (!await context.OperatorActivityLogs.AnyAsync())
            {
                logger.LogInformation("Seeding historical Operator Activity Logs...");
                var random = new Random();
                var taskTypes = new[] { "Putaway", "Pick", "Replenish", "Count" };
                var skus = new[] { "SKU-RED-TSHIRT", "SKU-BLUE-JEANS", "A0-001", "A0-002" };
                var operatorSubs = new[] { "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8", "1a382041-9098-4351-ab71-d3939f8368dd" };
                var warehouses = await context.Warehouses.ToListAsync();
                var startDate = DateTime.UtcNow.AddDays(-30);

                var newLogs = new List<OperatorActivityLog>();

                foreach (var wh in warehouses)
                {
                    // Generate ~50-80 activity logs per warehouse over the last 30 days
                    int logsToCreate = random.Next(50, 80);
                    for (int i = 0; i < logsToCreate; i++)
                    {
                        var taskType = taskTypes[random.Next(taskTypes.Length)];
                        var sku = skus[random.Next(skus.Length)];
                        var opId = operatorSubs[random.Next(operatorSubs.Length)];
                        
                        // Pick random date within the last 30 days
                        var completedAt = startDate.AddDays(random.NextDouble() * 30).AddHours(random.Next(24)).AddMinutes(random.Next(60));
                        var durationMinutes = random.Next(2, 15) + random.NextDouble();
                        var startedAt = completedAt.AddMinutes(-durationMinutes);
                        
                        var qty = taskType == "Count" ? random.Next(10, 500) : random.Next(1, 20);

                        newLogs.Add(new OperatorActivityLog(
                            "default-tenant",
                            wh.Id,
                            opId,
                            taskType,
                            Guid.NewGuid(),
                            sku,
                            qty,
                            startedAt,
                            completedAt
                        ));
                    }
                }

                if (newLogs.Count > 0)
                {
                    context.OperatorActivityLogs.AddRange(newLogs);
                    await context.SaveChangesAsync();
                }
            }

            logger.LogInformation("Successfully completed all seeding operations.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the Warehouse database.");
        }
    }

    private static async Task SeedWarehouseRoutesOnlyAsync(WMSDbContext context, ILogger logger)
    {
        var ctId = Guid.Parse("b61a8f61-5238-4a18-809c-335cc293a025"); // Can Tho
        var sgId = Guid.Parse("a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"); // HCM
        var ntId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2"); // Nha Trang
        var dnId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3"); // Da Nang
        var vId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4"); // Vinh
        var hnId = Guid.Parse("e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5"); // Hanoi
        var hpId = Guid.Parse("f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6"); // Hai Phong

        logger.LogInformation("Seeding all 42 Warehouse Routes (Next-Hop Matrix)...");
        var routes = new List<WarehouseRoute>
        {
            // From Can Tho (ctId) - South
            new WarehouseRoute(ctId, sgId, sgId), // Can Tho -> HCM (Direct)
            new WarehouseRoute(ctId, ntId, sgId), // Can Tho -> Nha Trang (via HCM)
            new WarehouseRoute(ctId, dnId, sgId), // Can Tho -> Da Nang (via HCM)
            new WarehouseRoute(ctId, vId, sgId),  // Can Tho -> Vinh (via HCM)
            new WarehouseRoute(ctId, hnId, sgId), // Can Tho -> Hanoi (via HCM)
            new WarehouseRoute(ctId, hpId, sgId), // Can Tho -> Hai Phong (via HCM)

            // From HCM (sgId) - South Hub
            new WarehouseRoute(sgId, ctId, ctId), // HCM -> Can Tho (Direct)
            new WarehouseRoute(sgId, ntId, ntId), // HCM -> Nha Trang (Direct)
            new WarehouseRoute(sgId, dnId, dnId), // HCM -> Da Nang (Direct)
            new WarehouseRoute(sgId, vId, dnId),  // HCM -> Vinh (via Da Nang)
            new WarehouseRoute(sgId, hnId, hnId), // HCM -> Hanoi (Direct)
            new WarehouseRoute(sgId, hpId, hnId), // HCM -> Hai Phong (via Hanoi)

            // From Nha Trang (ntId) - South-Central
            new WarehouseRoute(ntId, ctId, sgId), // Nha Trang -> Can Tho (via HCM)
            new WarehouseRoute(ntId, sgId, sgId), // Nha Trang -> HCM (Direct)
            new WarehouseRoute(ntId, dnId, dnId), // Nha Trang -> Da Nang (Direct)
            new WarehouseRoute(ntId, vId, dnId),  // Nha Trang -> Vinh (via Da Nang)
            new WarehouseRoute(ntId, hnId, dnId), // Nha Trang -> Hanoi (via Da Nang)
            new WarehouseRoute(ntId, hpId, dnId), // Nha Trang -> Hai Phong (via Da Nang)

            // From Da Nang (dnId) - Central Hub
            new WarehouseRoute(dnId, ctId, sgId), // Da Nang -> Can Tho (via HCM)
            new WarehouseRoute(dnId, sgId, sgId), // Da Nang -> HCM (Direct)
            new WarehouseRoute(dnId, ntId, ntId), // Da Nang -> Nha Trang (Direct)
            new WarehouseRoute(dnId, vId, vId),   // Da Nang -> Vinh (Direct)
            new WarehouseRoute(dnId, hnId, hnId), // Da Nang -> Hanoi (Direct)
            new WarehouseRoute(dnId, hpId, hnId), // Da Nang -> Hai Phong (via Hanoi)

            // From Vinh (vId) - North-Central
            new WarehouseRoute(vId, ctId, dnId), // Vinh -> Can Tho (via Da Nang)
            new WarehouseRoute(vId, sgId, dnId), // Vinh -> HCM (via Da Nang)
            new WarehouseRoute(vId, ntId, dnId), // Vinh -> Nha Trang (via Da Nang)
            new WarehouseRoute(vId, dnId, dnId), // Vinh -> Da Nang (Direct)
            new WarehouseRoute(vId, hnId, hnId), // Vinh -> Hanoi (Direct)
            new WarehouseRoute(vId, hpId, hnId), // Vinh -> Hai Phong (via Hanoi)

            // From Hanoi (hnId) - North Hub
            new WarehouseRoute(hnId, ctId, sgId), // Hanoi -> Can Tho (via HCM)
            new WarehouseRoute(hnId, sgId, sgId), // Hanoi -> HCM (Direct)
            new WarehouseRoute(hnId, ntId, dnId), // Hanoi -> Nha Trang (via Da Nang)
            new WarehouseRoute(hnId, dnId, dnId), // Hanoi -> Da Nang (Direct)
            new WarehouseRoute(hnId, vId, vId),   // Hanoi -> Vinh (Direct)
            new WarehouseRoute(hnId, hpId, hpId), // Hanoi -> Hai Phong (Direct)

            // From Hai Phong (hpId) - North
            new WarehouseRoute(hpId, ctId, hnId), // Hai Phong -> Can Tho (via Hanoi)
            new WarehouseRoute(hpId, sgId, hnId), // Hai Phong -> HCM (via Hanoi)
            new WarehouseRoute(hpId, ntId, hnId), // Hai Phong -> Nha Trang (via Hanoi)
            new WarehouseRoute(hpId, dnId, hnId), // Hai Phong -> Da Nang (via Hanoi)
            new WarehouseRoute(hpId, vId, hnId),  // Hai Phong -> Vinh (via Hanoi)
            new WarehouseRoute(hpId, hnId, hnId)  // Hai Phong -> Hanoi (Direct)
        };

        context.WarehouseRoutes.AddRange(routes);
        await context.SaveChangesAsync();
        logger.LogInformation("Successfully seeded all 42 Warehouse Routes Next-Hop Matrix.");
    }
}
