using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.src.Services.Warehouse.Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpgradeWarehouseOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ActualDestinationBinId",
                table: "ReplenishmentTasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ActualFromBinId",
                table: "PickTasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxQuantity",
                table: "Bins",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MaxVolume",
                table: "Bins",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "MaxWeight",
                table: "Bins",
                type: "double precision",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TaskOverrideLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperatorId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaskType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    OriginalBinCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ActualBinCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskOverrideLogs", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "MaxQuantity", "MaxVolume", "MaxWeight" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "MaxQuantity", "MaxVolume", "MaxWeight" },
                values: new object[] { null, null, null });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                columns: new[] { "MaxQuantity", "MaxVolume", "MaxWeight" },
                values: new object[] { null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_ReplenishmentTasks_ActualDestinationBinId",
                table: "ReplenishmentTasks",
                column: "ActualDestinationBinId");

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_ActualFromBinId",
                table: "PickTasks",
                column: "ActualFromBinId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskOverrideLogs_TaskId",
                table: "TaskOverrideLogs",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskOverrideLogs_WarehouseId_OperatorId",
                table: "TaskOverrideLogs",
                columns: new[] { "WarehouseId", "OperatorId" });

            migrationBuilder.AddForeignKey(
                name: "FK_PickTasks_Bins_ActualFromBinId",
                table: "PickTasks",
                column: "ActualFromBinId",
                principalTable: "Bins",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ReplenishmentTasks_Bins_ActualDestinationBinId",
                table: "ReplenishmentTasks",
                column: "ActualDestinationBinId",
                principalTable: "Bins",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PickTasks_Bins_ActualFromBinId",
                table: "PickTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_ReplenishmentTasks_Bins_ActualDestinationBinId",
                table: "ReplenishmentTasks");

            migrationBuilder.DropTable(
                name: "TaskOverrideLogs");

            migrationBuilder.DropIndex(
                name: "IX_ReplenishmentTasks_ActualDestinationBinId",
                table: "ReplenishmentTasks");

            migrationBuilder.DropIndex(
                name: "IX_PickTasks_ActualFromBinId",
                table: "PickTasks");

            migrationBuilder.DropColumn(
                name: "ActualDestinationBinId",
                table: "ReplenishmentTasks");

            migrationBuilder.DropColumn(
                name: "ActualFromBinId",
                table: "PickTasks");

            migrationBuilder.DropColumn(
                name: "MaxQuantity",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "MaxVolume",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "MaxWeight",
                table: "Bins");
        }
    }
}
