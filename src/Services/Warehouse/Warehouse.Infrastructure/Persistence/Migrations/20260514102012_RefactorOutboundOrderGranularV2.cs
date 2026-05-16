using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorOutboundOrderGranularV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllowPartial",
                table: "OutboundOrders",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinationAddress",
                table: "OutboundOrders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinationCity",
                table: "OutboundOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderNo",
                table: "OutboundOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "OutboundOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_TenantId_OrderNo",
                table: "OutboundOrders",
                columns: new[] { "TenantId", "OrderNo" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OutboundOrders_TenantId_OrderNo",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "AllowPartial",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "DestinationAddress",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "DestinationCity",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "OrderNo",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "OutboundOrders");
        }
    }
}
