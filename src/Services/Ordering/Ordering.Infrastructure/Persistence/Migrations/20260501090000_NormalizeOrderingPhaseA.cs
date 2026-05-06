using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ordering.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeOrderingPhaseA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Pre-check before apply (staging/prod): duplicate SkuCode per order
            // SELECT "OrderId", "SkuCode", COUNT(*) FROM "OrderItems" WHERE "SkuCode" IS NOT NULL GROUP BY 1,2 HAVING COUNT(*) > 1;
            // Pre-check: duplicate ExternalReference per tenant + consignor
            // SELECT "TenantId","CustomerId","ExternalReference",COUNT(*) FROM "Orders" WHERE "ExternalReference" IS NOT NULL GROUP BY 1,2,3 HAVING COUNT(*) > 1;

            migrationBuilder.DropIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
                table: "OrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ExternalReference",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems");

            migrationBuilder.AddColumn<string>(
                name: "ChangedByOperatorId",
                table: "OrderStatusHistories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CorrelationId",
                table: "OrderStatusHistories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "OrderStatusHistories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
                table: "OrderStatusHistories",
                columns: new[] { "OrderId", "ChangedAtUtc" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DestinationWarehouseId_Status",
                table: "Orders",
                columns: new[] { "DestinationWarehouseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_CreatedAt",
                table: "Orders",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TenantId_CustomerId_ExternalReference",
                table: "Orders",
                columns: new[] { "TenantId", "CustomerId", "ExternalReference" },
                unique: true,
                filter: "\"ExternalReference\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId_SkuCode",
                table: "OrderItems",
                columns: new[] { "OrderId", "SkuCode" },
                unique: true,
                filter: "\"SkuCode\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
                table: "OrderStatusHistories");

            migrationBuilder.DropIndex(
                name: "IX_Orders_DestinationWarehouseId_Status",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status_CreatedAt",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_TenantId_CustomerId_ExternalReference",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_OrderId_SkuCode",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "ChangedByOperatorId",
                table: "OrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "CorrelationId",
                table: "OrderStatusHistories");

            migrationBuilder.DropColumn(
                name: "Reason",
                table: "OrderStatusHistories");

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
                table: "OrderStatusHistories",
                columns: new[] { "OrderId", "ChangedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ExternalReference",
                table: "Orders",
                column: "ExternalReference");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId",
                table: "OrderItems",
                column: "OrderId");
        }
    }
}
