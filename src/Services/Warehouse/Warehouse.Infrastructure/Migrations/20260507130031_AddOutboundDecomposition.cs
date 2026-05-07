using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOutboundDecomposition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OutboundOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    AllowPartial = table.Column<bool>(type: "boolean", nullable: false),
                    PlannedShipAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DestinationAddress = table.Column<string>(type: "text", nullable: false),
                    DestinationCity = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboundOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PickTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromBinId = table.Column<Guid>(type: "uuid", nullable: false),
                    Qty = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    WaveId = table.Column<string>(type: "text", nullable: true),
                    PickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickTasks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Carrier = table.Column<string>(type: "text", nullable: true),
                    RouteId = table.Column<string>(type: "text", nullable: false),
                    TrackingNo = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ShippedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DestinationKey = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboundOrderLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkuCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Uom = table.Column<string>(type: "text", nullable: false),
                    RequestedQty = table.Column<int>(type: "integer", nullable: false),
                    ReservedQty = table.Column<int>(type: "integer", nullable: false),
                    PickedQty = table.Column<int>(type: "integer", nullable: false),
                    PackedQty = table.Column<int>(type: "integer", nullable: false),
                    ShippedQty = table.Column<int>(type: "integer", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "ShipmentItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentItems", x => x.Id);
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
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShipmentOrders_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
                table: "OutboundOrderLines",
                columns: new[] { "OutboundOrderId", "SkuCode" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_WarehouseId_Status_PlannedShipAt",
                table: "OutboundOrders",
                columns: new[] { "WarehouseId", "Status", "PlannedShipAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_FromBinId_Status",
                table: "PickTasks",
                columns: new[] { "FromBinId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_OutboundLineId_Status",
                table: "PickTasks",
                columns: new[] { "OutboundLineId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentItems_ShipmentId_OutboundLineId",
                table: "ShipmentItems",
                columns: new[] { "ShipmentId", "OutboundLineId" });

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentOrders_ShipmentId_OutboundOrderId",
                table: "ShipmentOrders",
                columns: new[] { "ShipmentId", "OutboundOrderId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ShipmentNo",
                table: "Shipments",
                column: "ShipmentNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_WarehouseId_Status_ShippedAt",
                table: "Shipments",
                columns: new[] { "WarehouseId", "Status", "ShippedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OutboundOrderLines");

            migrationBuilder.DropTable(
                name: "PickTasks");

            migrationBuilder.DropTable(
                name: "ShipmentItems");

            migrationBuilder.DropTable(
                name: "ShipmentOrders");

            migrationBuilder.DropTable(
                name: "OutboundOrders");

            migrationBuilder.DropTable(
                name: "Shipments");
        }
    }
}
