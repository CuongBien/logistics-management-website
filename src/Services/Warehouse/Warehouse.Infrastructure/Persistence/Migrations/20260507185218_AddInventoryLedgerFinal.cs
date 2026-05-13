using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryLedgerFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InventoryLedgers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    DeltaQty = table.Column<int>(type: "integer", nullable: false),
                    BalanceAfter = table.Column<int>(type: "integer", nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ReferenceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OperatorSub = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryLedgers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryLedgers_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_CorrelationId",
                table: "InventoryLedgers",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_InventoryItemId",
                table: "InventoryLedgers",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_ReferenceId",
                table: "InventoryLedgers",
                column: "ReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_Sku_WarehouseId_OccurredAt",
                table: "InventoryLedgers",
                columns: new[] { "Sku", "WarehouseId", "OccurredAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InventoryLedgers");
        }
    }
}
