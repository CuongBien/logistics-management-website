using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBinPhysicalLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Aisle",
                table: "Bins",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PickSequence",
                table: "Bins",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Rack",
                table: "Bins",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Shelf",
                table: "Bins",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "Aisle", "PickSequence", "Rack", "Shelf" },
                values: new object[] { "A", 1, "1", "01" });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "Aisle", "PickSequence", "Rack", "Shelf" },
                values: new object[] { "A", 2, "1", "02" });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                columns: new[] { "Aisle", "PickSequence", "Rack", "Shelf" },
                values: new object[] { "B", 1, "1", "01" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Aisle",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "PickSequence",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "Rack",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "Shelf",
                table: "Bins");
        }
    }
}
