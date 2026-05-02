using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Warehouse.Infrastructure.Persistence;

namespace Warehouse.Infrastructure.Migrations;

[DbContext(typeof(WMSDbContext))]
[Migration("20260502120000_AddOutboundOrders")]
public class AddOutboundOrders : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "OutboundOrders",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                DestinationWarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                Status = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OutboundOrders", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "OutboundOrderLines",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OutboundOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                SkuCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                RequestedQty = table.Column<int>(type: "integer", nullable: false),
                Uom = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OutboundOrderLines", x => x.Id);
                table.ForeignKey(
                    name: "FK_OutboundOrderLines_OutboundOrders_OutboundOrderId",
                    column: x => x.OutboundOrderId,
                    principalTable: "OutboundOrders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_OutboundOrders_TenantId_OrderId",
            table: "OutboundOrders",
            columns: new[] { "TenantId", "OrderId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
            table: "OutboundOrderLines",
            columns: new[] { "OutboundOrderId", "SkuCode" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "OutboundOrderLines");
        migrationBuilder.DropTable(name: "OutboundOrders");
    }
}
