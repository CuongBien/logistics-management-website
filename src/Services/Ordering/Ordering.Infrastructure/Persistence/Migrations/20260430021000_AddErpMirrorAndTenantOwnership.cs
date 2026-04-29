using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ordering.Infrastructure.Persistence.Migrations
{
    public partial class AddErpMirrorAndTenantOwnership : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TenantId",
                table: "Orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "CustomerId",
                table: "Orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: string.Empty);

            migrationBuilder.AddColumn<string>(
                name: "ExternalReference",
                table: "Orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SkuCode",
                table: "OrderItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

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

            migrationBuilder.CreateIndex(name: "IX_Orders_TenantId_CustomerId", table: "Orders", columns: new[] { "TenantId", "CustomerId" });
            migrationBuilder.CreateIndex(name: "IX_Orders_ExternalReference", table: "Orders", column: "ExternalReference");
            migrationBuilder.CreateIndex(name: "IX_OrderItems_SkuCode", table: "OrderItems", column: "SkuCode");
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
            migrationBuilder.DropIndex(name: "IX_Orders_TenantId_CustomerId", table: "Orders");
            migrationBuilder.DropIndex(name: "IX_Orders_ExternalReference", table: "Orders");
            migrationBuilder.DropIndex(name: "IX_OrderItems_SkuCode", table: "OrderItems");
            migrationBuilder.DropColumn(name: "TenantId", table: "Orders");
            migrationBuilder.DropColumn(name: "CustomerId", table: "Orders");
            migrationBuilder.DropColumn(name: "ExternalReference", table: "Orders");
            migrationBuilder.DropColumn(name: "SkuCode", table: "OrderItems");
        }
    }
}
