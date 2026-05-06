using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class W3_FixInventoryItemUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_InventoryItems_TenantId_CustomerId_Sku\";");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_TenantId_CustomerId_Sku",
                table: "InventoryItems",
                columns: new[] { "TenantId", "CustomerId", "Sku" },
                unique: true);
        }
    }
}
