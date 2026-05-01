using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Ordering.Infrastructure.Persistence.Migrations;

public partial class AddOrderStatusHistory : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "OrderStatusHistories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                StatusFrom = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                StatusTo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                ChangedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                Source = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OrderStatusHistories", x => x.Id);
                table.ForeignKey(
                    name: "FK_OrderStatusHistories_Orders_OrderId",
                    column: x => x.OrderId,
                    principalTable: "Orders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
            table: "OrderStatusHistories",
            columns: new[] { "OrderId", "ChangedAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_OrderStatusHistories_TenantId_ChangedAtUtc",
            table: "OrderStatusHistories",
            columns: new[] { "TenantId", "ChangedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "OrderStatusHistories");
    }
}
