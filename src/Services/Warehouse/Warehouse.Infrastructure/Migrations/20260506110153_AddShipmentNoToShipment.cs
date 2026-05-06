using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddShipmentNoToShipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"Shipments\";");

            migrationBuilder.AddColumn<string>(
                name: "ShipmentNo",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "ShipmentNo",
                table: "Shipments");
        }
    }
}
