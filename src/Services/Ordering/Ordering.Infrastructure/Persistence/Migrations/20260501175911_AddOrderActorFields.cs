using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ordering.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderActorFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByOperatorId",
                table: "Orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByOperatorId",
                table: "Orders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedByOperatorId",
                table: "Orders",
                column: "CreatedByOperatorId",
                filter: "\"CreatedByOperatorId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UpdatedByOperatorId",
                table: "Orders",
                column: "UpdatedByOperatorId",
                filter: "\"UpdatedByOperatorId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_CreatedByOperatorId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_UpdatedByOperatorId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CreatedByOperatorId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "UpdatedByOperatorId",
                table: "Orders");
        }
    }
}
