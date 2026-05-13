using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryReservationCompositeIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_ExpiresAt",
                table: "inventory_reservations");

            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_InventoryItemId",
                table: "inventory_reservations");

            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_ReferenceId_ReferenceType",
                table: "inventory_reservations");

            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_Status",
                table: "inventory_reservations");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_CorrelationId",
                table: "inventory_reservations",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_InventoryItemId_Status_ExpiresAt",
                table: "inventory_reservations",
                columns: new[] { "InventoryItemId", "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_ReferenceId_ReferenceType_Status",
                table: "inventory_reservations",
                columns: new[] { "ReferenceId", "ReferenceType", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_CorrelationId",
                table: "inventory_reservations");

            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_InventoryItemId_Status_ExpiresAt",
                table: "inventory_reservations");

            migrationBuilder.DropIndex(
                name: "IX_inventory_reservations_ReferenceId_ReferenceType_Status",
                table: "inventory_reservations");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_ExpiresAt",
                table: "inventory_reservations",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_InventoryItemId",
                table: "inventory_reservations",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_ReferenceId_ReferenceType",
                table: "inventory_reservations",
                columns: new[] { "ReferenceId", "ReferenceType" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_Status",
                table: "inventory_reservations",
                column: "Status");
        }
    }
}
