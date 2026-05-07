using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateInventoryReservationDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_reservations_InventoryItems_InventoryItemId",
                table: "inventory_reservations");

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_reservations_InventoryItems_InventoryItemId",
                table: "inventory_reservations",
                column: "InventoryItemId",
                principalTable: "InventoryItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_inventory_reservations_InventoryItems_InventoryItemId",
                table: "inventory_reservations");

            migrationBuilder.AddForeignKey(
                name: "FK_inventory_reservations_InventoryItems_InventoryItemId",
                table: "inventory_reservations",
                column: "InventoryItemId",
                principalTable: "InventoryItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
