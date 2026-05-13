using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InboundSchemaAndExceptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InboundItems");

            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_SourceShipmentNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_WarehouseId_CreatedAt",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_ZoneId",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "DestinationWarehouseId",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "InboundReceipts");

            migrationBuilder.RenameColumn(
                name: "SourceShipmentNo",
                table: "InboundReceipts",
                newName: "ShipmentNo");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Zones",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Zones",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Warehouses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Warehouses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Shipments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Shipments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ShipmentNo",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "InboundReceipts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "InboundReceipts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReceiptNo",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceRef",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceType",
                table: "InboundReceipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Blocks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Blocks",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Bins",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Bins",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "Bins",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "DispositionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    InboundLineId = table.Column<Guid>(type: "uuid", nullable: true),
                    InventoryStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DispositionLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DispositionLogs_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InboundReceiptLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReceiptId = table.Column<Guid>(type: "uuid", nullable: false),
                    LineNo = table.Column<int>(type: "integer", nullable: false),
                    SkuCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Uom = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ExpectedQty = table.Column<int>(type: "integer", nullable: false),
                    ReceivedQty = table.Column<int>(type: "integer", nullable: false),
                    RejectedQty = table.Column<int>(type: "integer", nullable: false),
                    RejectionReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ShortageQty = table.Column<int>(type: "integer", nullable: false),
                    LotNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
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
                    AllocatedQty = table.Column<int>(type: "integer", nullable: false),
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

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"),
                columns: new[] { "DeletedAt", "IsDeleted", "WarehouseId" },
                values: new object[] { null, false, new Guid("11111111-1111-1111-1111-111111111111") });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"),
                columns: new[] { "DeletedAt", "IsDeleted", "WarehouseId" },
                values: new object[] { null, false, new Guid("11111111-1111-1111-1111-111111111111") });

            migrationBuilder.UpdateData(
                table: "Bins",
                keyColumn: "Id",
                keyValue: new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                columns: new[] { "DeletedAt", "IsDeleted", "WarehouseId" },
                values: new object[] { null, false, new Guid("48b030da-e7ad-452f-90db-ddb01a613583") });

            migrationBuilder.UpdateData(
                table: "Blocks",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Blocks",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Warehouses",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Warehouses",
                keyColumn: "Id",
                keyValue: new Guid("48b030da-e7ad-452f-90db-ddb01a613583"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Zones",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.UpdateData(
                table: "Zones",
                keyColumn: "Id",
                keyValue: new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                columns: new[] { "DeletedAt", "IsDeleted" },
                values: new object[] { null, false });

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones",
                columns: new[] { "BlockId", "ZoneType" },
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_ReceiptNo",
                table: "InboundReceipts",
                column: "ReceiptNo",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_WarehouseId_SourceType_SourceRef_ShipmentNo",
                table: "InboundReceipts",
                columns: new[] { "WarehouseId", "SourceType", "SourceRef", "ShipmentNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks",
                columns: new[] { "WarehouseId", "BlockCode" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins",
                columns: new[] { "WarehouseId", "BinCode" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Bins_ZoneId_Status",
                table: "Bins",
                columns: new[] { "ZoneId", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bin_Version_Positive",
                table: "Bins",
                sql: "\"Version\" >= 1");

            migrationBuilder.CreateIndex(
                name: "IX_DispositionLogs_InventoryItemId",
                table: "DispositionLogs",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_BinId",
                table: "InboundBinAllocations",
                column: "BinId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId",
                table: "InboundBinAllocations",
                column: "ReceiptLineId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceiptLines_ReceiptId_LineNo",
                table: "InboundReceiptLines",
                columns: new[] { "ReceiptId", "LineNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DispositionLogs");

            migrationBuilder.DropTable(
                name: "InboundBinAllocations");

            migrationBuilder.DropTable(
                name: "InboundReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones");

            migrationBuilder.DropIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_WarehouseId_SourceType_SourceRef_ShipmentNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks");

            migrationBuilder.DropIndex(
                name: "IX_Bins_WarehouseId_BinCode",
                table: "Bins");

            migrationBuilder.DropIndex(
                name: "IX_Bins_ZoneId_Status",
                table: "Bins");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bin_Version_Positive",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Zones");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Zones");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "SourceRef",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "SourceType",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Blocks");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Blocks");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Bins");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Bins");

            migrationBuilder.RenameColumn(
                name: "ShipmentNo",
                table: "InboundReceipts",
                newName: "SourceShipmentNo");

            migrationBuilder.AddColumn<Guid>(
                name: "DestinationWarehouseId",
                table: "OutboundOrders",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "InboundReceipts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

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
                name: "IX_Zones_BlockId",
                table: "Zones",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_SourceShipmentNo",
                table: "InboundReceipts",
                column: "SourceShipmentNo");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "CustomerId", "OrderId", "WarehouseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_WarehouseId_CreatedAt",
                table: "InboundReceipts",
                columns: new[] { "WarehouseId", "CreatedAt" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId",
                table: "Blocks",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_Bins_ZoneId",
                table: "Bins",
                column: "ZoneId");

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
