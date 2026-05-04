using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class W1_OverviewSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_Sku",
                table: "InventoryItems");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Warehouses",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "BinId",
                table: "InventoryItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "InventoryItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "InboundReceipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "InboundReceipts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "InboundReceipts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "OutboundOrder",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PlannedShipAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboundOrder", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shipment",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    DestinationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DestinationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ShippedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipment", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Warehouses",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "Code",
                value: "HAN_01");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId",
                table: "InventoryItems",
                columns: new[] { "TenantId", "WarehouseId", "Sku", "BinId" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_InventoryItem_QtyOnHand_Positive",
                table: "InventoryItems",
                sql: "\"QuantityOnHand\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_InventoryItem_ReservedQty_Lte_OnHand",
                table: "InventoryItems",
                sql: "\"ReservedQty\" <= \"QuantityOnHand\"");

            migrationBuilder.AddCheckConstraint(
                name: "CK_InventoryItem_ReservedQty_Positive",
                table: "InventoryItems",
                sql: "\"ReservedQty\" >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_WarehouseId_CreatedAt",
                table: "InboundReceipts",
                columns: new[] { "WarehouseId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrder_WarehouseId_Status_PlannedShipAt",
                table: "OutboundOrder",
                columns: new[] { "WarehouseId", "Status", "PlannedShipAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Shipment_WarehouseId_Status_ShippedAt",
                table: "Shipment",
                columns: new[] { "WarehouseId", "Status", "ShippedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "OutboundOrder");
            migrationBuilder.DropTable(name: "Shipment");

            migrationBuilder.DropIndex(name: "IX_Warehouses_Code", table: "Warehouses");
            migrationBuilder.DropIndex(name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId", table: "InventoryItems");
            migrationBuilder.DropIndex(name: "IX_InboundReceipts_WarehouseId_CreatedAt", table: "InboundReceipts");

            migrationBuilder.DropCheckConstraint(name: "CK_InventoryItem_QtyOnHand_Positive", table: "InventoryItems");
            migrationBuilder.DropCheckConstraint(name: "CK_InventoryItem_ReservedQty_Lte_OnHand", table: "InventoryItems");
            migrationBuilder.DropCheckConstraint(name: "CK_InventoryItem_ReservedQty_Positive", table: "InventoryItems");

            migrationBuilder.DropColumn(name: "Code", table: "Warehouses");
            migrationBuilder.DropColumn(name: "BinId", table: "InventoryItems");
            migrationBuilder.DropColumn(name: "WarehouseId", table: "InventoryItems");
            migrationBuilder.DropColumn(name: "CreatedAt", table: "InboundReceipts");
            migrationBuilder.DropColumn(name: "WarehouseId", table: "InboundReceipts");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "InboundReceipts",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_Sku",
                table: "InventoryItems",
                column: "Sku",
                unique: true);
        }
    }
}
