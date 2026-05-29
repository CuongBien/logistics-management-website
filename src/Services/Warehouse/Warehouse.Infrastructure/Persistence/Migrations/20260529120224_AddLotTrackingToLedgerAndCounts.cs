using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.src.Services.Warehouse.Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLotTrackingToLedgerAndCounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "InventoryReconciliationReports",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LotNo",
                table: "InventoryReconciliationReports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "InventoryLedgers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LotNo",
                table: "InventoryLedgers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "CountTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LotNo",
                table: "CountTasks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "InventoryReconciliationReports");

            migrationBuilder.DropColumn(
                name: "LotNo",
                table: "InventoryReconciliationReports");

            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "InventoryLedgers");

            migrationBuilder.DropColumn(
                name: "LotNo",
                table: "InventoryLedgers");

            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "CountTasks");

            migrationBuilder.DropColumn(
                name: "LotNo",
                table: "CountTasks");
        }
    }
}
