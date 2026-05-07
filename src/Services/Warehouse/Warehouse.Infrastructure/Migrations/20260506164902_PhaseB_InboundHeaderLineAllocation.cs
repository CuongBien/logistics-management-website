using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PhaseB_InboundHeaderLineAllocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InboundItems");

            migrationBuilder.AddColumn<string>(
                name: "ReceiptNo",
                table: "InboundReceipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "InboundReceiptLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExpectedQuantity = table.Column<int>(type: "integer", nullable: false),
                    ReceivedQuantity = table.Column<int>(type: "integer", nullable: false),
                    LotNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboundReceiptLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InboundReceiptLines_InboundReceipts_ReceiptId",
                        column: x => x.ReceiptId,
                        principalTable: "InboundReceipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InboundBinAllocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiptLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboundBinAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InboundBinAllocations_Bins_BinId",
                        column: x => x.BinId,
                        principalTable: "Bins",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InboundBinAllocations_InboundReceiptLines_ReceiptLineId",
                        column: x => x.ReceiptLineId,
                        principalTable: "InboundReceiptLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_ReceiptNo",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "ReceiptNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_BinId",
                table: "InboundBinAllocations",
                column: "BinId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId_BinId_TenantId",
                table: "InboundBinAllocations",
                columns: new[] { "ReceiptLineId", "BinId", "TenantId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceiptLines_ReceiptId_Sku",
                table: "InboundReceiptLines",
                columns: new[] { "ReceiptId", "Sku" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InboundBinAllocations");

            migrationBuilder.DropTable(
                name: "InboundReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.CreateTable(
                name: "InboundItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Sku = table.Column<string>(type: "text", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboundItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InboundItems_Bins_BinId",
                        column: x => x.BinId,
                        principalTable: "Bins",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_InboundItems_InboundReceipts_ReceiptId",
                        column: x => x.ReceiptId,
                        principalTable: "InboundReceipts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboundItems_BinId",
                table: "InboundItems",
                column: "BinId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundItems_ReceiptId",
                table: "InboundItems",
                column: "ReceiptId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundItems_TenantId_CustomerId_Sku",
                table: "InboundItems",
                columns: new[] { "TenantId", "CustomerId", "Sku" });
        }
    }
}
