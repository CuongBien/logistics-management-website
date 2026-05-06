using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Zones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Zones",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Warehouses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Warehouses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Shipments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Shipments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "InboundReceipts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "InboundReceipts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Blocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Blocks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Bins",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Bins",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Blocks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Blocks",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Warehouses",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Warehouses",
                keyColumn: "Id",
                keyValue: new Guid("48b030da-e7ad-452f-90db-ddb01a613583"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Zones",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Zones",
                keyColumn: "Id",
                keyValue: new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones",
                columns: new[] { "BlockId", "ZoneType" },
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "CustomerId", "OrderId", "WarehouseId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks",
                columns: new[] { "WarehouseId", "BlockCode" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins",
                columns: new[] { "WarehouseId", "BinCode" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Zones");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Zones");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Blocks");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Blocks");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Bins");

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones",
                columns: new[] { "BlockId", "ZoneType" });

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "CustomerId", "OrderId", "WarehouseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks",
                columns: new[] { "WarehouseId", "BlockCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins",
                columns: new[] { "WarehouseId", "BinCode" },
                unique: true);
        }
    }
}
