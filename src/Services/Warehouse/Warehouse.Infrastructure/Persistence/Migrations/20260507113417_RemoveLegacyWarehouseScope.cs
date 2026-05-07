using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyWarehouseScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "operator_warehouse_scopes");

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Code", "IsActive", "Resource" },
                values: new object[] { new Guid("00000000-0000-0000-0000-000000000003"), "sort", "outbound:sort", true, "outbound" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000003"));

            migrationBuilder.CreateTable(
                name: "operator_warehouse_scopes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OperatorProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_warehouse_scopes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_operator_warehouse_scopes_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_operator_warehouse_scopes_operator_profiles_OperatorProfile~",
                        column: x => x.OperatorProfileId,
                        principalTable: "operator_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_operator_warehouse_scopes_OperatorProfileId_WarehouseId",
                table: "operator_warehouse_scopes",
                columns: new[] { "OperatorProfileId", "WarehouseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_operator_warehouse_scopes_WarehouseId",
                table: "operator_warehouse_scopes",
                column: "WarehouseId");
        }
    }
}
