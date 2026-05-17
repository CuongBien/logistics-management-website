using MasterData.Domain.Entities;
using MasterData.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MasterData.Infrastructure.Persistence;

public static class MasterDataDbContextSeed
{
    public static async Task SeedAsync(MasterDataDbContext context, ILogger logger)
    {
        try
        {
            // 1. Seed ConsolidationRules
            if (!await context.ConsolidationRules.AnyAsync())
            {
                logger.LogInformation("Seeding Consolidation Rules...");
                context.ConsolidationRules.AddRange(
                    new ConsolidationRule("RULE-MOTO-001", "Motorbike", 2.5, 50, 0.2m, true),
                    new ConsolidationRule("RULE-TRUCK-1.5T", "Truck_1_5T", 15.0, 1500, 4.5m, true),
                    new ConsolidationRule("RULE-TRUCK-8T", "Truck_8T", 50.0, 8000, 24.0m, true),
                    new ConsolidationRule("RULE-CONTAINER", "Container", 300.0, 25000, 68.0m, false)
                );
                await context.SaveChangesAsync();
            }

            // 2. Seed 7 Vietnam Warehouses as Partners
            if (!await context.Partners.AnyAsync(p => p.Type == PartnerType.Warehouse))
            {
                logger.LogInformation("Seeding 7 Vietnam Warehouses as Partners...");
                var tenantId = "default-tenant";

                context.Partners.AddRange(
                    new Partner(tenantId, "WH-CT-001", "Can Tho Delivery Hub", PartnerType.Warehouse, "0901230001", "99 Can Tho Ave", "Can Tho", 10.037110, 105.788250),
                    new Partner(tenantId, "WH-SG-002", "HCM Mega Hub", PartnerType.Warehouse, "0901230002", "120 Nguyen Van Linh", "Ho Chi Minh", 10.762622, 106.660172),
                    new Partner(tenantId, "WH-NT-003", "Nha Trang Delivery Hub", PartnerType.Warehouse, "0901230003", "45 Tran Phu", "Khanh Hoa", 12.238791, 109.196749),
                    new Partner(tenantId, "WH-DN-004", "Da Nang Sorting Center", PartnerType.Warehouse, "0901230004", "88 Nguyen Huu Tho", "Da Nang", 16.054407, 108.202164),
                    new Partner(tenantId, "WH-V-005", "Vinh Delivery Hub", PartnerType.Warehouse, "0901230005", "12 Le Loi", "Nghe An", 18.673470, 105.681290),
                    new Partner(tenantId, "WH-HN-006", "Hanoi Mega Hub", PartnerType.Warehouse, "0901230006", "10 Hoang Hoa Tham", "Ha Noi", 21.028511, 105.804817),
                    new Partner(tenantId, "WH-HP-007", "Hai Phong Delivery Hub", PartnerType.Warehouse, "0901230007", "50 Lach Tray", "Hai Phong", 20.844912, 106.688079)
                );
                await context.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the MasterData database.");
        }
    }
}
