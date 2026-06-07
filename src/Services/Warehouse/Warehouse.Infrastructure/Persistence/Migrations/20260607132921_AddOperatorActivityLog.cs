using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.src.Services.Warehouse.Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOperatorActivityLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "ReplenishmentTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "ReplenishmentTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "PutawayTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "PickTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "CountTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "CountTasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OperatorActivityLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperatorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    TaskType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TaskId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DurationSeconds = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperatorActivityLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OperatorActivityLogs_WarehouseId_CompletedAt",
                table: "OperatorActivityLogs",
                columns: new[] { "WarehouseId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_OperatorActivityLogs_WarehouseId_OperatorId",
                table: "OperatorActivityLogs",
                columns: new[] { "WarehouseId", "OperatorId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OperatorActivityLogs");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "ReplenishmentTasks");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "ReplenishmentTasks");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "PutawayTasks");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "PickTasks");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "CountTasks");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "CountTasks");
        }
    }
}
