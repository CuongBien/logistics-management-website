using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.src.Services.Warehouse.Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLotAndExpiryToInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId",
                table: "InventoryItems");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "InventoryItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LotNo",
                table: "InventoryItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId_LotNo",
                table: "InventoryItems",
                columns: new[] { "TenantId", "WarehouseId", "Sku", "BinId", "LotNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId_LotNo",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "LotNo",
                table: "InventoryItems");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId",
                table: "InventoryItems",
                columns: new[] { "TenantId", "WarehouseId", "Sku", "BinId" },
                unique: true);
        }
    }
}
