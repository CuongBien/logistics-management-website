using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    public partial class AddErpMirrorAndTenantOwnership : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "InventoryItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "CustomerId",
                table: "InventoryItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "CustomerId",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "SourceShipmentNo",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "InboundItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "CustomerId",
                table: "InboundItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.CreateTable(
                name: "erp_skus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ErpSkuId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SkuCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedAtErp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_erp_skus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "erp_sync_checkpoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LastSuccessCursor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_erp_sync_checkpoints", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "erp_warehouses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ErpWarehouseId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedAtErp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_erp_warehouses", x => x.Id);
                });

            migrationBuilder.CreateIndex(name: "IX_InboundReceipts_TenantId_CustomerId_OrderId", table: "InboundReceipts", columns: new[] { "TenantId", "CustomerId", "OrderId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_InboundReceipts_SourceShipmentNo", table: "InboundReceipts", column: "SourceShipmentNo");
            migrationBuilder.CreateIndex(name: "IX_InboundItems_TenantId_CustomerId_Sku", table: "InboundItems", columns: new[] { "TenantId", "CustomerId", "Sku" });
            migrationBuilder.CreateIndex(name: "IX_InventoryItems_TenantId_CustomerId_Sku", table: "InventoryItems", columns: new[] { "TenantId", "CustomerId", "Sku" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_erp_skus_TenantId_ErpSkuId", table: "erp_skus", columns: new[] { "TenantId", "ErpSkuId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_erp_skus_TenantId_SkuCode", table: "erp_skus", columns: new[] { "TenantId", "SkuCode" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_erp_warehouses_TenantId_ErpWarehouseId", table: "erp_warehouses", columns: new[] { "TenantId", "ErpWarehouseId" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_erp_warehouses_TenantId_WarehouseCode", table: "erp_warehouses", columns: new[] { "TenantId", "WarehouseCode" }, unique: true);
            migrationBuilder.CreateIndex(name: "IX_erp_sync_checkpoints_TenantId_EntityType", table: "erp_sync_checkpoints", columns: new[] { "TenantId", "EntityType" }, unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "erp_skus");
            migrationBuilder.DropTable(name: "erp_warehouses");
            migrationBuilder.DropTable(name: "erp_sync_checkpoints");
            migrationBuilder.DropIndex(name: "IX_InboundReceipts_TenantId_CustomerId_OrderId", table: "InboundReceipts");
            migrationBuilder.DropIndex(name: "IX_InboundReceipts_SourceShipmentNo", table: "InboundReceipts");
            migrationBuilder.DropIndex(name: "IX_InboundItems_TenantId_CustomerId_Sku", table: "InboundItems");
            migrationBuilder.DropIndex(name: "IX_InventoryItems_TenantId_CustomerId_Sku", table: "InventoryItems");
            migrationBuilder.DropColumn(name: "TenantId", table: "InventoryItems");
            migrationBuilder.DropColumn(name: "CustomerId", table: "InventoryItems");
            migrationBuilder.DropColumn(name: "TenantId", table: "InboundReceipts");
            migrationBuilder.DropColumn(name: "CustomerId", table: "InboundReceipts");
            migrationBuilder.DropColumn(name: "SourceShipmentNo", table: "InboundReceipts");
            migrationBuilder.DropColumn(name: "TenantId", table: "InboundItems");
            migrationBuilder.DropColumn(name: "CustomerId", table: "InboundItems");
        }
    }
}
