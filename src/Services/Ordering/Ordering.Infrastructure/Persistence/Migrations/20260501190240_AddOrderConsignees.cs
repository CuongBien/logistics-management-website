using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ordering.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderConsignees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderConsignees",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Street = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ZipCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderConsignees", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK_OrderConsignees_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Idempotent backfill from inline owned-type columns on Orders (PostgreSQL).
            migrationBuilder.Sql(@"
INSERT INTO ""OrderConsignees""
(""OrderId"", ""FullName"", ""Phone"", ""Street"", ""City"", ""State"", ""Country"", ""ZipCode"", ""CreatedAt"")
SELECT
    o.""Id"",
    o.""Consignee_FullName"",
    o.""Consignee_Phone"",
    o.""Consignee_Address_Street"",
    o.""Consignee_Address_City"",
    o.""Consignee_Address_State"",
    o.""Consignee_Address_Country"",
    o.""Consignee_Address_ZipCode"",
    o.""CreatedAt""
FROM ""Orders"" o
LEFT JOIN ""OrderConsignees"" c ON c.""OrderId"" = o.""Id""
WHERE c.""OrderId"" IS NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderConsignees");
        }
    }
}
