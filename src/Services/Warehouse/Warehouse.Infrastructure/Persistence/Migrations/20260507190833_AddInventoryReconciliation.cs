using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryReconciliation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InventoryReconciliationReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotQty = table.Column<int>(type: "integer", nullable: false),
                    LedgerQty = table.Column<int>(type: "integer", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryReconciliationReports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReconciliationReports_DetectedAt",
                table: "InventoryReconciliationReports",
                column: "DetectedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReconciliationReports_Sku_Status",
                table: "InventoryReconciliationReports",
                columns: new[] { "Sku", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventoryReconciliationReports");
        }
    }
}
