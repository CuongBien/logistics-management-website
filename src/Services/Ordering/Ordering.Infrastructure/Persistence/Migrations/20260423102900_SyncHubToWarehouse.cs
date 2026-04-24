using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ordering.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncHubToWarehouse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DestinationHubId",
                table: "OrderStates",
                newName: "DestinationWarehouseId");

            migrationBuilder.RenameColumn(
                name: "DestinationHubId",
                table: "Orders",
                newName: "DestinationWarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DestinationWarehouseId",
                table: "OrderStates",
                newName: "DestinationHubId");

            migrationBuilder.RenameColumn(
                name: "DestinationWarehouseId",
                table: "Orders",
                newName: "DestinationHubId");
        }
    }
}
