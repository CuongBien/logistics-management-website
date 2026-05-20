using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Ordering.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FinalInitialOMS : Migration
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
                name: "Orders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomerId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ConsignorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExternalReference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Consignee_FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Consignee_Phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Consignee_Address_Street = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Consignee_Address_City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Consignee_Address_State = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Consignee_Address_Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Consignee_Address_ZipCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    WaybillCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CodAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    ShippingFee = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Weight = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastModifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByOperatorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UpdatedByOperatorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PickupDriverId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    WarehouseId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DestinationWarehouseId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeliveryDriverId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RouteId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProofOfDeliveryUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DeliveryAttempts = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Orders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderStates",
                columns: table => new
                {
                    CorrelationId = table.Column<Guid>(type: "uuid", nullable: false),
                    CurrentState = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsignorId = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    WaybillCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CodAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PickupDriverId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    WarehouseId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DestinationWarehouseId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeliveryDriverId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RouteId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ProofOfDeliveryUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DeliveryAttempts = table.Column<int>(type: "integer", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderStates", x => x.CorrelationId);
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

            migrationBuilder.CreateTable(
                name: "OrderItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<Guid>(type: "uuid", nullable: false),
                    SkuCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderItems_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                    Source = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ChangedByOperatorId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CorrelationId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
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
                name: "IX_InboxState_Delivered",
                table: "InboxState",
                column: "Delivered");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_OrderId_SkuCode",
                table: "OrderItems",
                columns: new[] { "OrderId", "SkuCode" },
                unique: true,
                filter: "\"SkuCode\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_SkuCode",
                table: "OrderItems",
                column: "SkuCode");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedByOperatorId",
                table: "Orders",
                column: "CreatedByOperatorId",
                filter: "\"CreatedByOperatorId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_DestinationWarehouseId_Status",
                table: "Orders",
                columns: new[] { "DestinationWarehouseId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_CreatedAt",
                table: "Orders",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TenantId_CustomerId",
                table: "Orders",
                columns: new[] { "TenantId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TenantId_CustomerId_ExternalReference",
                table: "Orders",
                columns: new[] { "TenantId", "CustomerId", "ExternalReference" },
                unique: true,
                filter: "\"ExternalReference\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_UpdatedByOperatorId",
                table: "Orders",
                column: "UpdatedByOperatorId",
                filter: "\"UpdatedByOperatorId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_WaybillCode",
                table: "Orders",
                column: "WaybillCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_OrderId_ChangedAtUtc",
                table: "OrderStatusHistories",
                columns: new[] { "OrderId", "ChangedAtUtc" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_OrderStatusHistories_TenantId_ChangedAtUtc",
                table: "OrderStatusHistories",
                columns: new[] { "TenantId", "ChangedAtUtc" });

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
                name: "InboxState");

            migrationBuilder.DropTable(
                name: "OrderConsignees");

            migrationBuilder.DropTable(
                name: "OrderItems");

            migrationBuilder.DropTable(
                name: "OrderStates");

            migrationBuilder.DropTable(
                name: "OrderStatusHistories");

            migrationBuilder.DropTable(
                name: "OutboxMessage");

            migrationBuilder.DropTable(
                name: "OutboxState");

            migrationBuilder.DropTable(
                name: "Orders");
        }
    }
}
