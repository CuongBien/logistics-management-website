using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGpsAndMultiHopRouting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "OutboundOrders",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "OutboundOrders",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Volume",
                table: "OutboundOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "OutboundOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "WarehouseRoutes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    DestinationWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Hops = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WarehouseRoutes", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WarehouseRoutes");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "Volume",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "OutboundOrders");
        }
    }
}
