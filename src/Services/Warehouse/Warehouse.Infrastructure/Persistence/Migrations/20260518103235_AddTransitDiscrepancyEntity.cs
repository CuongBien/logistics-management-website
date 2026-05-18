using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTransitDiscrepancyEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TransitDiscrepancies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ShippedQty = table.Column<int>(type: "integer", nullable: false),
                    ReceivedQty = table.Column<int>(type: "integer", nullable: false),
                    DiscrepancyQty = table.Column<int>(type: "integer", nullable: false),
                    Carrier = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OperatorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransitDiscrepancies", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Code", "IsActive", "Resource" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000016"), "resolve_discrepancy", "inbound:resolve_discrepancy", true, "inbound" });

            migrationBuilder.CreateIndex(
                name: "IX_TransitDiscrepancies_OutboundOrderId",
                table: "TransitDiscrepancies",
                column: "OutboundOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_TransitDiscrepancies_ShipmentId",
                table: "TransitDiscrepancies",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TransitDiscrepancies_WarehouseId",
                table: "TransitDiscrepancies",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransitDiscrepancies");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000016"));
        }
    }
}
