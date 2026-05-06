using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class W3_FixInboundReceiptUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId",
                table: "InboundReceipts");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "CustomerId", "OrderId", "WarehouseId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "CustomerId", "OrderId" },
                unique: true);
        }
    }
}
