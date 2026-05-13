using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PhaseB_InboundHeaderLineAllocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceiptLines_ReceiptId_Sku",
                table: "InboundReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId_BinId",
                table: "InboundBinAllocations");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiptNo",
                table: "InboundReceipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_ReceiptNo",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "ReceiptNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceiptLines_ReceiptId_Sku",
                table: "InboundReceiptLines",
                columns: new[] { "ReceiptId", "Sku" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId_BinId_TenantId",
                table: "InboundBinAllocations",
                columns: new[] { "ReceiptLineId", "BinId", "TenantId" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceiptLines_ReceiptId_Sku",
                table: "InboundReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId_BinId_TenantId",
                table: "InboundBinAllocations");

            migrationBuilder.AlterColumn<string>(
                name: "ReceiptNo",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_ReceiptNo",
                table: "InboundReceipts",
                column: "ReceiptNo",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceiptLines_ReceiptId_Sku",
                table: "InboundReceiptLines",
                columns: new[] { "ReceiptId", "Sku" },
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId_BinId",
                table: "InboundBinAllocations",
                columns: new[] { "ReceiptLineId", "BinId" },
                filter: "\"IsDeleted\" = false");
        }
    }
}
