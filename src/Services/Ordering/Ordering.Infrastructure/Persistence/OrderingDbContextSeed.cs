using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Reflection;
using System.Threading.Tasks;
using Ordering.Domain.Entities;
using Ordering.Domain.Enums;
using Ordering.Domain.ValueObjects;

namespace Ordering.Infrastructure.Persistence;

public static class OrderingDbContextSeed
{
    public static async Task SeedAsync(ApplicationDbContext context, ILogger logger)
    {
        try
        {
            logger.LogInformation("Seeding Ordering database...");

            // Clean Ordering transactional tables on every startup for fresh seed
            try
            {
                logger.LogInformation("Cleaning Ordering transactional tables for fresh seed...");
                await context.Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"OrderItems\", \"Orders\" CASCADE;");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not truncate Ordering transactional tables.");
            }

            logger.LogInformation("Seeding synchronized test orders for customer1 (5107728a-5b22-49dd-a608-718ed99dbaeb) pointing to HCMC Hub...");

            // Order 1: New / AwaitingPickup -> OUT-CUST1-0001
            var order1 = Order.Create(
                "default-tenant",
                "5107728a-5b22-49dd-a608-718ed99dbaeb",
                new Consignee("Nguyen Van A", "0901234567", new Address("789 Nguyen Hue, District 1", "HCMC", "HCM", "VN", "70000")),
                150000, 35000, 1.5m, "Giao gio hanh chinh", OrderType.Parcel, FulfillmentMode.Pickup
            ).Value;
            
            typeof(Order).GetProperty(nameof(Order.Id))!.SetValue(order1, Guid.Parse("d1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1"));
            typeof(Order).GetProperty(nameof(Order.WaybillCode))!.SetValue(order1, "OUT-CUST1-0001");
            typeof(Order).GetProperty(nameof(Order.Status))!.SetValue(order1, OrderStatus.New);
            order1.AddItem(Guid.NewGuid(), "SKU-RED-TSHIRT", 2, 60000);
            order1.AddItem(Guid.NewGuid(), "SKU-BLUE-JEANS", 1, 120000);

            // Order 2: Delivering / InWarehouse / Dispatched -> OUT-CUST1-0002
            var order2 = Order.Create(
                "default-tenant",
                "5107728a-5b22-49dd-a608-718ed99dbaeb",
                new Consignee("Tran Thi B", "0912345678", new Address("456 Le Loi, District 1", "HCMC", "HCM", "VN", "70000")),
                300000, 35000, 2.0m, "Giao nhanh", OrderType.Parcel, FulfillmentMode.Pickup
            ).Value;

            typeof(Order).GetProperty(nameof(Order.Id))!.SetValue(order2, Guid.Parse("d2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2"));
            typeof(Order).GetProperty(nameof(Order.WaybillCode))!.SetValue(order2, "OUT-CUST1-0002");
            typeof(Order).GetProperty(nameof(Order.Status))!.SetValue(order2, OrderStatus.Delivering);
            typeof(Order).GetProperty(nameof(Order.WarehouseId))!.SetValue(order2, "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
            order2.AddItem(Guid.NewGuid(), "SKU-RED-TSHIRT", 5, 60000);

            // Order 3: Delivered -> OUT-CUST1-0003
            var order3 = Order.Create(
                "default-tenant",
                "5107728a-5b22-49dd-a608-718ed99dbaeb",
                new Consignee("Le Van C", "0987654321", new Address("123 Tran Hung Dao, District 5", "HCMC", "HCM", "VN", "70000")),
                360000, 35000, 3.5m, "Giao truoc 5h chieu", OrderType.Parcel, FulfillmentMode.Pickup
            ).Value;

            typeof(Order).GetProperty(nameof(Order.Id))!.SetValue(order3, Guid.Parse("d3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3"));
            typeof(Order).GetProperty(nameof(Order.WaybillCode))!.SetValue(order3, "OUT-CUST1-0003");
            typeof(Order).GetProperty(nameof(Order.Status))!.SetValue(order3, OrderStatus.Delivered);
            typeof(Order).GetProperty(nameof(Order.WarehouseId))!.SetValue(order3, "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
            order3.AddItem(Guid.NewGuid(), "SKU-BLUE-JEANS", 3, 120000);

            // Order 4: Cancelled -> OUT-CUST1-0004
            var order4 = Order.Create(
                "default-tenant",
                "5107728a-5b22-49dd-a608-718ed99dbaeb",
                new Consignee("Pham Van D", "0909090909", new Address("111 Nguyen Van Linh, District 7", "HCMC", "HCM", "VN", "70000")),
                0, 35000, 0.5m, "Khong lien lac duoc", OrderType.Parcel, FulfillmentMode.Pickup
            ).Value;

            typeof(Order).GetProperty(nameof(Order.Id))!.SetValue(order4, Guid.Parse("d4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4"));
            typeof(Order).GetProperty(nameof(Order.WaybillCode))!.SetValue(order4, "OUT-CUST1-0004");
            typeof(Order).GetProperty(nameof(Order.Status))!.SetValue(order4, OrderStatus.Cancelled);
            typeof(Order).GetProperty(nameof(Order.WarehouseId))!.SetValue(order4, "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
            order4.AddItem(Guid.NewGuid(), "SKU-RED-TSHIRT", 1, 60000);

            // Order 5: InWarehouse -> OUT-CUST1-0005
            var order5 = Order.Create(
                "default-tenant",
                "5107728a-5b22-49dd-a608-718ed99dbaeb",
                new Consignee("Hoang Thi E", "0911111111", new Address("222 Huynh Tan Phat, District 7", "HCMC", "HCM", "VN", "70000")),
                120000, 35000, 1.0m, "Giao gio hanh chinh", OrderType.Parcel, FulfillmentMode.Pickup
            ).Value;

            typeof(Order).GetProperty(nameof(Order.Id))!.SetValue(order5, Guid.Parse("d5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5"));
            typeof(Order).GetProperty(nameof(Order.WaybillCode))!.SetValue(order5, "OUT-CUST1-0005");
            typeof(Order).GetProperty(nameof(Order.Status))!.SetValue(order5, OrderStatus.InWarehouse);
            typeof(Order).GetProperty(nameof(Order.WarehouseId))!.SetValue(order5, "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
            order5.AddItem(Guid.NewGuid(), "SKU-BLUE-JEANS", 1, 120000);

            context.Orders.AddRange(order1, order2, order3, order4, order5);
            await context.SaveChangesAsync();

            logger.LogInformation("Successfully seeded 5 test orders for customer1 in Ordering DB.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding Ordering database.");
        }
    }
}
