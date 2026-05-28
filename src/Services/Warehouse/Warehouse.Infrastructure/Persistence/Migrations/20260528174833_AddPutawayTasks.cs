using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.src.Services.Warehouse.Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPutawayTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PutawayTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LotNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    SourceBinId = table.Column<Guid>(type: "uuid", nullable: false),
                    SuggestedBinId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActualBinId = table.Column<Guid>(type: "uuid", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    OperatorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PutawayTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PutawayTasks_Bins_ActualBinId",
                        column: x => x.ActualBinId,
                        principalTable: "Bins",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PutawayTasks_Bins_SourceBinId",
                        column: x => x.SourceBinId,
                        principalTable: "Bins",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PutawayTasks_Bins_SuggestedBinId",
                        column: x => x.SuggestedBinId,
                        principalTable: "Bins",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PutawayTasks_ActualBinId",
                table: "PutawayTasks",
                column: "ActualBinId");

            migrationBuilder.CreateIndex(
                name: "IX_PutawayTasks_SourceBinId",
                table: "PutawayTasks",
                column: "SourceBinId");

            migrationBuilder.CreateIndex(
                name: "IX_PutawayTasks_SuggestedBinId",
                table: "PutawayTasks",
                column: "SuggestedBinId");

            migrationBuilder.CreateIndex(
                name: "IX_PutawayTasks_WarehouseId_Status",
                table: "PutawayTasks",
                columns: new[] { "WarehouseId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PutawayTasks");
        }
    }
}
