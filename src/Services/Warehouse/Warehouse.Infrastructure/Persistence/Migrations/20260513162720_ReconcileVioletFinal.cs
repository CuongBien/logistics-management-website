using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReconcileVioletFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PickTasks");

            migrationBuilder.DropTable(
                name: "ShipmentItems");

            migrationBuilder.DropTable(
                name: "ShipmentOrders");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_Destination",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_CustomerId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrders_ExternalOrderId",
                table: "OutboundOrders");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrders_OrderId",
                table: "OutboundOrders");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrders_OrderNo",
                table: "OutboundOrders");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrders_TenantId_CustomerId",
                table: "OutboundOrders");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
                table: "OutboundOrderLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_SourceShipmentNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_TenantId_ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_WarehouseId_CreatedAt",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceiptLines_ReceiptId_Sku",
                table: "InboundReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId_BinId_TenantId",
                table: "InboundBinAllocations");

            migrationBuilder.DropColumn(
                name: "Carrier",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Destination",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "RouteId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "TrackingNo",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Destination",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "ExternalOrderId",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "OrderNo",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "OutboundOrders");

            migrationBuilder.DropColumn(
                name: "PackedQty",
                table: "OutboundOrderLines");

            migrationBuilder.DropColumn(
                name: "PickedQty",
                table: "OutboundOrderLines");

            migrationBuilder.DropColumn(
                name: "ReservedQty",
                table: "OutboundOrderLines");

            migrationBuilder.DropColumn(
                name: "ShippedQty",
                table: "OutboundOrderLines");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "InboundReceipts");

            migrationBuilder.RenameColumn(
                name: "SourceShipmentNo",
                table: "InboundReceipts",
                newName: "ShipmentNo");

            migrationBuilder.RenameColumn(
                name: "Sku",
                table: "InboundReceiptLines",
                newName: "SkuCode");

            migrationBuilder.RenameColumn(
                name: "ReceivedQuantity",
                table: "InboundReceiptLines",
                newName: "ShortageQty");

            migrationBuilder.RenameColumn(
                name: "ExpectedQuantity",
                table: "InboundReceiptLines",
                newName: "RejectedQty");

            migrationBuilder.RenameColumn(
                name: "Quantity",
                table: "InboundBinAllocations",
                newName: "AllocatedQty");

            migrationBuilder.AlterColumn<string>(
                name: "TenantId",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Shipments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "ShipmentNo",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "DestinationType",
                table: "Shipments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "CustomerId",
                table: "Shipments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

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

            migrationBuilder.AlterColumn<string>(
                name: "TenantId",
                table: "OutboundOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "OutboundOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "CustomerId",
                table: "OutboundOrders",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Uom",
                table: "OutboundOrderLines",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "InventoryItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "ReceiptNo",
                table: "InboundReceipts",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

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

            migrationBuilder.AddColumn<int>(
                name: "ExpectedQty",
                table: "InboundReceiptLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "LineNo",
                table: "InboundReceiptLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReceivedQty",
                table: "InboundReceiptLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "InboundReceiptLines",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "InboundReceiptLines",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Uom",
                table: "InboundReceiptLines",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

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
                name: "operator_warehouse_scopes",
                columns: table => new
                {
                    OperatorProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_warehouse_scopes", x => new { x.OperatorProfileId, x.WarehouseId });
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
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_TenantId_OrderId",
                table: "OutboundOrders",
                columns: new[] { "TenantId", "OrderId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
                table: "OutboundOrderLines",
                columns: new[] { "OutboundOrderId", "SkuCode" });

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
                name: "IX_InboundReceiptLines_ReceiptId_LineNo",
                table: "InboundReceiptLines",
                columns: new[] { "ReceiptId", "LineNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId",
                table: "InboundBinAllocations",
                column: "ReceiptLineId");

            migrationBuilder.CreateIndex(
                name: "IX_DispositionLogs_InventoryItemId",
                table: "DispositionLogs",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_operator_warehouse_scopes_WarehouseId",
                table: "operator_warehouse_scopes",
                column: "WarehouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DispositionLogs");

            migrationBuilder.DropTable(
                name: "operator_warehouse_scopes");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrders_TenantId_OrderId",
                table: "OutboundOrders");

            migrationBuilder.DropIndex(
                name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
                table: "OutboundOrderLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_ReceiptNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceipts_WarehouseId_SourceType_SourceRef_ShipmentNo",
                table: "InboundReceipts");

            migrationBuilder.DropIndex(
                name: "IX_InboundReceiptLines_ReceiptId_LineNo",
                table: "InboundReceiptLines");

            migrationBuilder.DropIndex(
                name: "IX_InboundBinAllocations_ReceiptLineId",
                table: "InboundBinAllocations");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "InventoryItems");

            migrationBuilder.DropColumn(
                name: "SourceRef",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "SourceType",
                table: "InboundReceipts");

            migrationBuilder.DropColumn(
                name: "ExpectedQty",
                table: "InboundReceiptLines");

            migrationBuilder.DropColumn(
                name: "LineNo",
                table: "InboundReceiptLines");

            migrationBuilder.DropColumn(
                name: "ReceivedQty",
                table: "InboundReceiptLines");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "InboundReceiptLines");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "InboundReceiptLines");

            migrationBuilder.DropColumn(
                name: "Uom",
                table: "InboundReceiptLines");

            migrationBuilder.RenameColumn(
                name: "ShipmentNo",
                table: "InboundReceipts",
                newName: "SourceShipmentNo");

            migrationBuilder.RenameColumn(
                name: "SkuCode",
                table: "InboundReceiptLines",
                newName: "Sku");

            migrationBuilder.RenameColumn(
                name: "ShortageQty",
                table: "InboundReceiptLines",
                newName: "ReceivedQuantity");

            migrationBuilder.RenameColumn(
                name: "RejectedQty",
                table: "InboundReceiptLines",
                newName: "ExpectedQuantity");

            migrationBuilder.RenameColumn(
                name: "AllocatedQty",
                table: "InboundBinAllocations",
                newName: "Quantity");

            migrationBuilder.AlterColumn<string>(
                name: "TenantId",
                table: "Shipments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Shipments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "ShipmentNo",
                table: "Shipments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<int>(
                name: "DestinationType",
                table: "Shipments",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "CustomerId",
                table: "Shipments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "Carrier",
                table: "Shipments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Destination",
                table: "Shipments",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RouteId",
                table: "Shipments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TrackingNo",
                table: "Shipments",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TenantId",
                table: "OutboundOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "OutboundOrders",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "CustomerId",
                table: "OutboundOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "Destination",
                table: "OutboundOrders",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ExternalOrderId",
                table: "OutboundOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OrderNo",
                table: "OutboundOrders",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "OutboundOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "Uom",
                table: "OutboundOrderLines",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AddColumn<int>(
                name: "PackedQty",
                table: "OutboundOrderLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PickedQty",
                table: "OutboundOrderLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReservedQty",
                table: "OutboundOrderLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ShippedQty",
                table: "OutboundOrderLines",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "ReceiptNo",
                table: "InboundReceipts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "InboundReceipts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "PickTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FromBinId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    PickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PickerSub = table.Column<string>(type: "text", nullable: true),
                    Qty = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    WaveId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickTasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShipmentItems",
                columns: table => new
                {
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentItems", x => new { x.ShipmentId, x.OutboundOrderLineId });
                    table.ForeignKey(
                        name: "FK_ShipmentItems_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShipmentOrders",
                columns: table => new
                {
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentOrders", x => new { x.ShipmentId, x.OutboundOrderId });
                    table.ForeignKey(
                        name: "FK_ShipmentOrders_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_Destination",
                table: "Shipments",
                column: "Destination");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ShipmentNo",
                table: "Shipments",
                column: "ShipmentNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TenantId_CustomerId",
                table: "Shipments",
                columns: new[] { "TenantId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_ExternalOrderId",
                table: "OutboundOrders",
                column: "ExternalOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_OrderId",
                table: "OutboundOrders",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_OrderNo",
                table: "OutboundOrders",
                column: "OrderNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_TenantId_CustomerId",
                table: "OutboundOrders",
                columns: new[] { "TenantId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
                table: "OutboundOrderLines",
                columns: new[] { "OutboundOrderId", "SkuCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_SourceShipmentNo",
                table: "InboundReceipts",
                column: "SourceShipmentNo");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_CustomerId_OrderId_WarehouseId",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "CustomerId", "OrderId", "WarehouseId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_TenantId_ReceiptNo",
                table: "InboundReceipts",
                columns: new[] { "TenantId", "ReceiptNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceipts_WarehouseId_CreatedAt",
                table: "InboundReceipts",
                columns: new[] { "WarehouseId", "CreatedAt" },
                descending: new[] { false, true });

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

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_FromBinId_Status",
                table: "PickTasks",
                columns: new[] { "FromBinId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_OutboundOrderLineId_Status",
                table: "PickTasks",
                columns: new[] { "OutboundOrderLineId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_WaveId",
                table: "PickTasks",
                column: "WaveId");
        }
    }
}
