using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCompleteRbacSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Already applied in manual DB changes
            migrationBuilder.DropColumn(
                name: "Hops",
                table: "WarehouseRoutes");

            migrationBuilder.AddColumn<Guid>(
                name: "NextHopWarehouseId",
                table: "WarehouseRoutes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Code", "IsActive", "Resource" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000007"), "transit_receive", "inbound:transit_receive", true, "inbound" },
                    { new Guid("00000000-0000-0000-0000-000000000008"), "create", "outbound:create", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000009"), "allocate", "outbound:allocate", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000010"), "pick", "outbound:pick", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000011"), "pack", "outbound:pack", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000012"), "load", "outbound:load", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000013"), "dispatch", "outbound:dispatch", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000014"), "manage", "route:manage", true, "route" },
                    { new Guid("00000000-0000-0000-0000-000000000015"), "reconcile", "inventory:reconcile", true, "inventory" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000007"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000008"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000009"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000010"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000011"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000012"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000013"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000014"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000015"));

            migrationBuilder.DropColumn(
                name: "NextHopWarehouseId",
                table: "WarehouseRoutes");

            migrationBuilder.AddColumn<string>(
                name: "Hops",
                table: "WarehouseRoutes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
