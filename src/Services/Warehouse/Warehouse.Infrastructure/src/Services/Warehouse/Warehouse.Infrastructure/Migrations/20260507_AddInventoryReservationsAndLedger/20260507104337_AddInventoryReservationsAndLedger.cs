using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.src.Services.Warehouse.Warehouse.Infrastructure.Migrations._20260507_AddInventoryReservationsAndLedger
{
    /// <inheritdoc />
    public partial class AddInventoryReservationsAndLedger : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_ZoneId",
                table: "Bins");

            migrationBuilder.AddColumn<string>(
                name: "ShipmentNo",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Version",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "Bins",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "InventoryLedger",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeltaQty = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    ReferenceType = table.Column<string>(type: "text", nullable: true),
                    ReferenceId = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryLedger", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InventoryReservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReservedQty = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReferenceType = table.Column<string>(type: "text", nullable: true),
                    ReferenceId = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryReservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryReservations_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                column: "WarehouseId",
                value: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                column: "WarehouseId",
                value: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                column: "WarehouseId",
                value: new Guid("48b030da-e7ad-452f-90db-ddb01a613583"));

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones",
                columns: new[] { "BlockId", "ZoneType" });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_WarehouseId_BinId",
                table: "InventoryItems",
                columns: new[] { "WarehouseId", "BinId" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_InventoryItem_Version_Min1",
                table: "InventoryItems",
                sql: "\"Version\" >= 1");

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

            migrationBuilder.CreateIndex(
                name: "IX_Bins_ZoneId_Status",
                table: "Bins",
                columns: new[] { "ZoneId", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bin_Version_Positive",
                table: "Bins",
                sql: "\"Version\" >= 1");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedger_CorrelationId",
                table: "InventoryLedger",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedger_Sku_WarehouseId_OccurredAt",
                table: "InventoryLedger",
                columns: new[] { "Sku", "WarehouseId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReservations_CorrelationId",
                table: "InventoryReservations",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReservations_InventoryItemId_Status_ExpiresAt",
                table: "InventoryReservations",
                columns: new[] { "InventoryItemId", "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReservations_OutboundLineId_Status",
                table: "InventoryReservations",
                columns: new[] { "OutboundLineId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventoryLedger");

            migrationBuilder.DropTable(
                name: "InventoryReservations");

            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_WarehouseId_BinId",
                table: "InventoryItems");

            migrationBuilder.DropCheckConstraint(
                name: "CK_InventoryItem_Version_Min1",
                table: "InventoryItems");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins");

            migrationBuilder.DropIndex(
                name: "IX_Bins_ZoneId_Status",
                table: "Bins");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bin_Version_Positive",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Bins");

            migrationBuilder.AlterColumn<int>(
                name: "Version",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId",
                table: "Zones",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId",
                table: "Blocks",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Bins_ZoneId",
                table: "Bins",
                column: "ZoneId");
        }
    }
}
