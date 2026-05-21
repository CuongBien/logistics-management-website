using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedByOperatorId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByOperatorId",
                table: "OutboundOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByOperatorId",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedByOperatorId",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "CreatedByOperatorId",
                table: "InboundReceipts");
        }
    }
}
