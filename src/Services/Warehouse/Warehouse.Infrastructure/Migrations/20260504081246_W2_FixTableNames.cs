using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class W2_FixTableNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Shipment",
                table: "Shipment");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OutboundOrder",
                table: "OutboundOrder");

            migrationBuilder.RenameTable(
                name: "Shipment",
                newName: "Shipments");

            migrationBuilder.RenameTable(
                name: "OutboundOrder",
                newName: "OutboundOrders");

            migrationBuilder.RenameIndex(
                name: "IX_Shipment_WarehouseId_Status_ShippedAt",
                table: "Shipments",
                newName: "IX_Shipments_WarehouseId_Status_ShippedAt");

            migrationBuilder.RenameIndex(
                name: "IX_OutboundOrder_WarehouseId_Status_PlannedShipAt",
                table: "OutboundOrders",
                newName: "IX_OutboundOrders_WarehouseId_Status_PlannedShipAt");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Shipments",
                table: "Shipments",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OutboundOrders",
                table: "OutboundOrders",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Shipments",
                table: "Shipments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OutboundOrders",
                table: "OutboundOrders");

            migrationBuilder.RenameTable(
                name: "Shipments",
                newName: "Shipment");

            migrationBuilder.RenameTable(
                name: "OutboundOrders",
                newName: "OutboundOrder");

            migrationBuilder.RenameIndex(
                name: "IX_Shipments_WarehouseId_Status_ShippedAt",
                table: "Shipment",
                newName: "IX_Shipment_WarehouseId_Status_ShippedAt");

            migrationBuilder.RenameIndex(
                name: "IX_OutboundOrders_WarehouseId_Status_PlannedShipAt",
                table: "OutboundOrder",
                newName: "IX_OutboundOrder_WarehouseId_Status_PlannedShipAt");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Shipment",
                table: "Shipment",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OutboundOrder",
                table: "OutboundOrder",
                column: "Id");
        }
    }
}
