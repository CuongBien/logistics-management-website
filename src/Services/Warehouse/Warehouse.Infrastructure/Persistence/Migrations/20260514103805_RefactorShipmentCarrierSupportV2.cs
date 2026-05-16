using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorShipmentCarrierSupportV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipmentOrders",
                table: "ShipmentOrders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipmentItems",
                table: "ShipmentItems");

            migrationBuilder.DropColumn(
                name: "DeliveredAt",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "DestinationName",
                table: "Shipments");

            migrationBuilder.AddColumn<string>(
                name: "TrackingNo",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "ShipmentOrders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "ShipmentItems",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipmentOrders",
                table: "ShipmentOrders",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipmentItems",
                table: "ShipmentItems",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentOrders_ShipmentId",
                table: "ShipmentOrders",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentItems_ShipmentId",
                table: "ShipmentItems",
                column: "ShipmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipmentOrders",
                table: "ShipmentOrders");

            migrationBuilder.DropIndex(
                name: "IX_ShipmentOrders_ShipmentId",
                table: "ShipmentOrders");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ShipmentItems",
                table: "ShipmentItems");

            migrationBuilder.DropIndex(
                name: "IX_ShipmentItems_ShipmentId",
                table: "ShipmentItems");

            migrationBuilder.DropColumn(
                name: "TrackingNo",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "ShipmentOrders");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "ShipmentItems");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredAt",
                table: "Shipments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DestinationName",
                table: "Shipments",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipmentOrders",
                table: "ShipmentOrders",
                columns: new[] { "ShipmentId", "OutboundOrderId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_ShipmentItems",
                table: "ShipmentItems",
                columns: new[] { "ShipmentId", "OutboundOrderLineId" });
        }
    }
}
