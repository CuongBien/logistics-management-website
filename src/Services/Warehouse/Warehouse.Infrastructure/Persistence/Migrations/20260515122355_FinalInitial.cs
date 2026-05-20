using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Warehouse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FinalInitial : Migration
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
                    ReceiptNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ShipmentNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SourceType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceRef = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReceivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboundReceipts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InboxState",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsumerId = table.Column<Guid>(type: "uuid", nullable: false),
                    LockId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    Received = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReceiveCount = table.Column<int>(type: "integer", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Consumed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Delivered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSequenceNumber = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxState", x => x.Id);
                    table.UniqueConstraint("AK_InboxState_MessageId_ConsumerId", x => new { x.MessageId, x.ConsumerId });
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
                    Status = table.Column<int>(type: "integer", nullable: false),
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
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PlannedShipAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboundOrders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessage",
                columns: table => new
                {
                    SequenceNumber = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EnqueueTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Headers = table.Column<string>(type: "text", nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    InboxMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    InboxConsumerId = table.Column<Guid>(type: "uuid", nullable: true),
                    OutboxId = table.Column<Guid>(type: "uuid", nullable: true),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    MessageType = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CorrelationId = table.Column<Guid>(type: "uuid", nullable: true),
                    InitiatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DestinationAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ResponseAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    FaultAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ExpirationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessage", x => x.SequenceNumber);
                });

            migrationBuilder.CreateTable(
                name: "OutboxState",
                columns: table => new
                {
                    OutboxId = table.Column<Guid>(type: "uuid", nullable: false),
                    LockId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Delivered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSequenceNumber = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxState", x => x.OutboxId);
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
                    ShipmentNo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uuid", nullable: false),
                    DestinationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DestinationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ShippedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
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
                name: "IX_DispositionLogs_InventoryItemId",
                table: "DispositionLogs",
                column: "InventoryItemId");

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
                name: "IX_InboundBinAllocations_ReceiptLineId",
                table: "InboundBinAllocations",
                column: "ReceiptLineId");

            migrationBuilder.CreateIndex(
                name: "IX_InboundReceiptLines_ReceiptId_LineNo",
                table: "InboundReceiptLines",
                columns: new[] { "ReceiptId", "LineNo" },
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
                name: "IX_InboxState_Delivered",
                table: "InboxState",
                column: "Delivered");

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
                name: "IX_operator_warehouse_scopes_WarehouseId",
                table: "operator_warehouse_scopes",
                column: "WarehouseId");

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
                name: "IX_OutboundOrderLines_OutboundOrderId_SkuCode",
                table: "OutboundOrderLines",
                columns: new[] { "OutboundOrderId", "SkuCode" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_TenantId_OrderId",
                table: "OutboundOrders",
                columns: new[] { "TenantId", "OrderId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboundOrders_WarehouseId_Status_PlannedShipAt",
                table: "OutboundOrders",
                columns: new[] { "WarehouseId", "Status", "PlannedShipAt" });

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_EnqueueTime",
                table: "OutboxMessage",
                column: "EnqueueTime");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_ExpirationTime",
                table: "OutboxMessage",
                column: "ExpirationTime");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_InboxMessageId_InboxConsumerId_SequenceNumber",
                table: "OutboxMessage",
                columns: new[] { "InboxMessageId", "InboxConsumerId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_OutboxId_SequenceNumber",
                table: "OutboxMessage",
                columns: new[] { "OutboxId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxState_Created",
                table: "OutboxState",
                column: "Created");

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Code",
                table: "Permissions",
                column: "Code",
                unique: true);

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
                name: "IX_Shipments_TenantId_ShipmentNo",
                table: "Shipments",
                columns: new[] { "TenantId", "ShipmentNo" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_WarehouseId_Status_ShippedAt",
                table: "Shipments",
                columns: new[] { "WarehouseId", "Status", "ShippedAt" });

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
                name: "DispositionLogs");

            migrationBuilder.DropTable(
                name: "erp_skus");

            migrationBuilder.DropTable(
                name: "erp_sync_checkpoints");

            migrationBuilder.DropTable(
                name: "erp_warehouses");

            migrationBuilder.DropTable(
                name: "InboundBinAllocations");

            migrationBuilder.DropTable(
                name: "InboxState");

            migrationBuilder.DropTable(
                name: "inventory_reservations");

            migrationBuilder.DropTable(
                name: "InventoryLedgers");

            migrationBuilder.DropTable(
                name: "InventoryReconciliationReports");

            migrationBuilder.DropTable(
                name: "operator_warehouse_scopes");

            migrationBuilder.DropTable(
                name: "OperatorRoleAssignments");

            migrationBuilder.DropTable(
                name: "OutboundOrderLines");

            migrationBuilder.DropTable(
                name: "OutboxMessage");

            migrationBuilder.DropTable(
                name: "OutboxState");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "Shipments");

            migrationBuilder.DropTable(
                name: "Bins");

            migrationBuilder.DropTable(
                name: "InboundReceiptLines");

            migrationBuilder.DropTable(
                name: "InventoryItems");

            migrationBuilder.DropTable(
                name: "operator_profiles");

            migrationBuilder.DropTable(
                name: "OutboundOrders");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Zones");

            migrationBuilder.DropTable(
                name: "InboundReceipts");

            migrationBuilder.DropTable(
                name: "Blocks");

            migrationBuilder.DropTable(
                name: "Warehouses");
        }
    }
}
