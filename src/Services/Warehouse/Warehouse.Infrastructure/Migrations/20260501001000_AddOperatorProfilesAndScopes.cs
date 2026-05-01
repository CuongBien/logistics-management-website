using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Warehouse.Infrastructure.Persistence;

namespace Warehouse.Infrastructure.Migrations;

[DbContext(typeof(WMSDbContext))]
[Migration("20260501001000_AddOperatorProfilesAndScopes")]
public partial class AddOperatorProfilesAndScopes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "operator_profiles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                OperatorSub = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                DisplayName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_operator_profiles", x => x.Id);
            });

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
                    name: "FK_operator_warehouse_scopes_operator_profiles_OperatorProfileId",
                    column: x => x.OperatorProfileId,
                    principalTable: "operator_profiles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_operator_warehouse_scopes_Warehouses_WarehouseId",
                    column: x => x.WarehouseId,
                    principalTable: "Warehouses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_operator_profiles_TenantId_OperatorSub",
            table: "operator_profiles",
            columns: new[] { "TenantId", "OperatorSub" },
            unique: true);

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

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "operator_warehouse_scopes");
        migrationBuilder.DropTable(name: "operator_profiles");
    }
}
