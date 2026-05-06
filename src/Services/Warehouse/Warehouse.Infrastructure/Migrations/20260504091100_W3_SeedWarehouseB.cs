using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class W3_SeedWarehouseB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Warehouses",
                columns: new[] { "Id", "Code", "LocationText", "Name" },
                values: new object[] { new Guid("48b030da-e7ad-452f-90db-ddb01a613583"), "DAD_01", "Danang, Vietnam", "Danang Central Warehouse" });

            migrationBuilder.InsertData(
                table: "Blocks",
                columns: new[] { "Id", "BlockCode", "WarehouseId" },
                values: new object[] { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "BLK-B", new Guid("48b030da-e7ad-452f-90db-ddb01a613583") });

            migrationBuilder.InsertData(
                table: "Zones",
                columns: new[] { "Id", "BlockId", "ZoneType" },
                values: new object[] { new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "Storage" });

            migrationBuilder.InsertData(
                table: "Bins",
                columns: new[] { "Id", "BinCode", "CurrentOrderId", "Status", "Version", "ZoneId" },
                values: new object[] { new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), "BIN-B1-01", null, "Available", 1, new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"));

            migrationBuilder.DeleteData(
                table: "Zones",
                keyColumn: "Id",
                keyValue: new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"));

            migrationBuilder.DeleteData(
                table: "Blocks",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

            migrationBuilder.DeleteData(
                table: "Warehouses",
                keyColumn: "Id",
                keyValue: new Guid("48b030da-e7ad-452f-90db-ddb01a613583"));
        }
    }
}
