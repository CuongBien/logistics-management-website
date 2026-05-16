using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialWarehouseSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "erp_skus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ErpSkuId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SkuCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    UnitOfMeasure = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedAtErp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_erp_skus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "erp_sync_checkpoints",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LastSuccessCursor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_erp_sync_checkpoints", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "erp_warehouses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ErpWarehouseId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedAtErp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_erp_warehouses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InboundReceipts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReceiptNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SourceShipmentNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboundReceipts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InventoryItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    QuantityOnHand = table.Column<int>(type: "integer", nullable: false),
                    ReservedQty = table.Column<int>(type: "integer", nullable: false),
                    LastRestockedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryItems", x => x.Id);
                    table.CheckConstraint("CK_InventoryItem_QtyOnHand_Positive", "\"QuantityOnHand\" >= 0");
                    table.CheckConstraint("CK_InventoryItem_ReservedQty_Lte_OnHand", "\"ReservedQty\" <= \"QuantityOnHand\"");
                    table.CheckConstraint("CK_InventoryItem_ReservedQty_Positive", "\"ReservedQty\" >= 0");
                });

            migrationBuilder.CreateTable(
                name: "InventoryReconciliationReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    SnapshotQty = table.Column<int>(type: "integer", nullable: false),
                    LedgerQty = table.Column<int>(type: "integer", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryReconciliationReports", x => x.Id);
                });

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
                name: "OutboundOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Destination = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PlannedShipAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboundOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Resource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ShipmentNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    DestinationType = table.Column<int>(type: "integer", nullable: false),
                    DestinationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DestinationName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Carrier = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RouteId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ShippedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Warehouses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    LocationText = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Warehouses", x => x.Id);
                });

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
                name: "inventory_reservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReferenceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ReferenceType = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CorrelationId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory_reservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_inventory_reservations_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InventoryLedgers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InventoryItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinId = table.Column<Guid>(type: "uuid", nullable: false),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    DeltaQty = table.Column<int>(type: "integer", nullable: false),
                    BalanceAfter = table.Column<int>(type: "integer", nullable: false),
                    ReferenceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ReferenceId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    OperatorSub = table.Column<string>(type: "text", nullable: true),
                    CorrelationId = table.Column<string>(type: "text", nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryLedgers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryLedgers_InventoryItems_InventoryItemId",
                        column: x => x.InventoryItemId,
                        principalTable: "InventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OutboundOrderLines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Uom = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
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
                name: "RolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    PermissionId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
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
                        name: "FK_ShipmentOrders_OutboundOrders_OutboundOrderId",
                        column: x => x.OutboundOrderId,
                        principalTable: "OutboundOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShipmentOrders_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Blocks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Blocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Blocks_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PickTasks",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OutboundOrderLineId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromBinId = table.Column<Guid>(type: "uuid", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssignedOperator = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PickTasks_OutboundOrderLines_OutboundOrderLineId",
                        column: x => x.OutboundOrderLineId,
                        principalTable: "OutboundOrderLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                        name: "FK_ShipmentItems_OutboundOrderLines_OutboundOrderLineId",
                        column: x => x.OutboundOrderLineId,
                        principalTable: "OutboundOrderLines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShipmentItems_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Zones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BlockId = table.Column<Guid>(type: "uuid", nullable: false),
                    ZoneType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Zones_Blocks_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Blocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: false),
                    BinCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CurrentOrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bins", x => x.Id);
                    table.CheckConstraint("CK_Bin_Version_Positive", "\"Version\" >= 1");
                    table.ForeignKey(
                        name: "FK_Bins_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OperatorRoleAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OperatorProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    ZoneId = table.Column<Guid>(type: "uuid", nullable: true),
                    EffectiveFrom = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EffectiveTo = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OperatorRoleAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OperatorRoleAssignments_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OperatorRoleAssignments_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OperatorRoleAssignments_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OperatorRoleAssignments_operator_profiles_OperatorProfileId",
                        column: x => x.OperatorProfileId,
                        principalTable: "operator_profiles",
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

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Code", "IsActive", "Resource" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), "receive", "inbound:receive", true, "inbound" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), "force_close", "inbound:force_close", true, "inbound" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), "sort", "outbound:sort", true, "outbound" },
                    { new Guid("00000000-0000-0000-0000-000000000004"), "reserve", "inventory:reserve", true, "inventory" },
                    { new Guid("00000000-0000-0000-0000-000000000005"), "release", "inventory:release", true, "inventory" },
                    { new Guid("00000000-0000-0000-0000-000000000006"), "consume", "inventory:consume", true, "inventory" }
                });

            migrationBuilder.InsertData(
                table: "Warehouses",
                columns: new[] { "Id", "Code", "DeletedAt", "IsDeleted", "LocationText", "Name" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), "HAN_01", null, false, "Hanoi, Vietnam", "Hanoi Central Warehouse" },
                    { new Guid("48b030da-e7ad-452f-90db-ddb01a613583"), "DAD_01", null, false, "Danang, Vietnam", "Danang Central Warehouse" }
                });

            migrationBuilder.InsertData(
                table: "Blocks",
                columns: new[] { "Id", "BlockCode", "DeletedAt", "IsDeleted", "WarehouseId" },
                values: new object[,]
                {
                    { new Guid("22222222-2222-2222-2222-222222222222"), "BLK-A", null, false, new Guid("11111111-1111-1111-1111-111111111111") },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), "BLK-B", null, false, new Guid("48b030da-e7ad-452f-90db-ddb01a613583") }
                });

            migrationBuilder.InsertData(
                table: "Zones",
                columns: new[] { "Id", "BlockId", "DeletedAt", "IsDeleted", "ZoneType" },
                values: new object[,]
                {
                    { new Guid("33333333-3333-3333-3333-333333333333"), new Guid("22222222-2222-2222-2222-222222222222"), null, false, "Storage" },
                    { new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), null, false, "Storage" }
                });

            migrationBuilder.InsertData(
                table: "Bins",
                columns: new[] { "Id", "BinCode", "CurrentOrderId", "DeletedAt", "IsDeleted", "Status", "Version", "WarehouseId", "ZoneId" },
                values: new object[,]
                {
                    { new Guid("44444444-4444-4444-4444-444444444444"), "BIN-A1-01", null, null, false, "Available", 1, new Guid("11111111-1111-1111-1111-111111111111"), new Guid("33333333-3333-3333-3333-333333333333") },
                    { new Guid("55555555-5555-5555-5555-555555555555"), "BIN-A1-02", null, null, false, "Available", 1, new Guid("11111111-1111-1111-1111-111111111111"), new Guid("33333333-3333-3333-3333-333333333333") },
                    { new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), "BIN-B1-01", null, null, false, "Available", 1, new Guid("48b030da-e7ad-452f-90db-ddb01a613583"), new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc") }
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_WarehouseId_BlockCode",
                table: "Blocks",
                columns: new[] { "WarehouseId", "BlockCode" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_erp_skus_TenantId_ErpSkuId",
                table: "erp_skus",
                columns: new[] { "TenantId", "ErpSkuId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_erp_skus_TenantId_SkuCode",
                table: "erp_skus",
                columns: new[] { "TenantId", "SkuCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_erp_sync_checkpoints_TenantId_EntityType",
                table: "erp_sync_checkpoints",
                columns: new[] { "TenantId", "EntityType" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_erp_warehouses_TenantId_ErpWarehouseId",
                table: "erp_warehouses",
                columns: new[] { "TenantId", "ErpWarehouseId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_erp_warehouses_TenantId_WarehouseCode",
                table: "erp_warehouses",
                columns: new[] { "TenantId", "WarehouseCode" },
                unique: true);

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
                name: "IX_inventory_reservations_CorrelationId",
                table: "inventory_reservations",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_InventoryItemId_Status_ExpiresAt",
                table: "inventory_reservations",
                columns: new[] { "InventoryItemId", "Status", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_inventory_reservations_ReferenceId_ReferenceType_Status",
                table: "inventory_reservations",
                columns: new[] { "ReferenceId", "ReferenceType", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryItems_TenantId_WarehouseId_Sku_BinId",
                table: "InventoryItems",
                columns: new[] { "TenantId", "WarehouseId", "Sku", "BinId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_CorrelationId",
                table: "InventoryLedgers",
                column: "CorrelationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_InventoryItemId",
                table: "InventoryLedgers",
                column: "InventoryItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_ReferenceId",
                table: "InventoryLedgers",
                column: "ReferenceId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryLedgers_Sku_WarehouseId_OccurredAt",
                table: "InventoryLedgers",
                columns: new[] { "Sku", "WarehouseId", "OccurredAt" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReconciliationReports_DetectedAt",
                table: "InventoryReconciliationReports",
                column: "DetectedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryReconciliationReports_Sku_Status",
                table: "InventoryReconciliationReports",
                columns: new[] { "Sku", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_operator_profiles_TenantId_OperatorSub",
                table: "operator_profiles",
                columns: new[] { "TenantId", "OperatorSub" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OperatorRoleAssignments_OperatorProfileId_WarehouseId_RoleI~",
                table: "OperatorRoleAssignments",
                columns: new[] { "OperatorProfileId", "WarehouseId", "RoleId", "ZoneId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OperatorRoleAssignments_RoleId",
                table: "OperatorRoleAssignments",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_OperatorRoleAssignments_WarehouseId",
                table: "OperatorRoleAssignments",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_OperatorRoleAssignments_ZoneId",
                table: "OperatorRoleAssignments",
                column: "ZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrderLines_OutboundOrderId_Sku",
                table: "OutboundOrderLines",
                columns: new[] { "OutboundOrderId", "Sku" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_OrderId",
                table: "OutboundOrders",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_WarehouseId_Status_PlannedShipAt",
                table: "OutboundOrders",
                columns: new[] { "WarehouseId", "Status", "PlannedShipAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Code",
                table: "Permissions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_FromBinId",
                table: "PickTasks",
                column: "FromBinId");

            migrationBuilder.CreateIndex(
                name: "IX_PickTasks_OutboundOrderLineId_Status",
                table: "PickTasks",
                columns: new[] { "OutboundOrderLineId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Code",
                table: "Roles",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentItems_OutboundOrderLineId",
                table: "ShipmentItems",
                column: "OutboundOrderLineId");

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentOrders_OutboundOrderId",
                table: "ShipmentOrders",
                column: "OutboundOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_ShipmentNo",
                table: "Shipments",
                column: "ShipmentNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_WarehouseId_Status_DestinationId",
                table: "Shipments",
                columns: new[] { "WarehouseId", "Status", "DestinationId" });

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_Code",
                table: "Warehouses",
                column: "Code",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Zones_BlockId_ZoneType",
                table: "Zones",
                columns: new[] { "BlockId", "ZoneType" },
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "erp_skus");

            migrationBuilder.DropTable(
                name: "erp_sync_checkpoints");

            migrationBuilder.DropTable(
                name: "erp_warehouses");

            migrationBuilder.DropTable(
                name: "InboundBinAllocations");

            migrationBuilder.DropTable(
                name: "inventory_reservations");

            migrationBuilder.DropTable(
                name: "InventoryLedgers");

            migrationBuilder.DropTable(
                name: "InventoryReconciliationReports");

            migrationBuilder.DropTable(
                name: "OperatorRoleAssignments");

            migrationBuilder.DropTable(
                name: "PickTasks");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "ShipmentItems");

            migrationBuilder.DropTable(
                name: "ShipmentOrders");

            migrationBuilder.DropTable(
                name: "Bins");

            migrationBuilder.DropTable(
                name: "InboundReceiptLines");

            migrationBuilder.DropTable(
                name: "InventoryItems");

            migrationBuilder.DropTable(
                name: "operator_profiles");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "OutboundOrderLines");

            migrationBuilder.DropTable(
                name: "Shipments");

            migrationBuilder.DropTable(
                name: "Zones");

            migrationBuilder.DropTable(
                name: "InboundReceipts");

            migrationBuilder.DropTable(
                name: "OutboundOrders");

            migrationBuilder.DropTable(
                name: "Blocks");

            migrationBuilder.DropTable(
                name: "Warehouses");
        }
    }
}
