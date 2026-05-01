# Logistics Management System (LMS) - Full Lifecycle Documentation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Infrastructure                                  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────────┐   │
│  │ PostgreSQL (56432)│  │ RabbitMQ (5672) │  │ Keycloak (18080)    │   │
│  │ - lms_oms_dev    │  │  - Exchange     │  │ - JWT Auth          │   │
│  │ - lms_wms_dev    │  │  - Queues       │  │                    │   │
│  └──────────────────┘  └─────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        API Gateway (YARP) :8000                           │
│   /api/oms/* ──► OMS :5000    /api/wms/* ──► WMS :5051                   │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐    ┌────────────────────────────────┐
│        OMS (Ordering Service)      │    │      WMS (Warehouse Service)   │
│            :5000                   │    │            :5051                │
│                                    │    │                                │
│  ┌────────────────────────────┐   │    │  ┌────────────────────────┐   │
│  │    Controllers              │   │    │  │   Controllers          │   │
│  │  - OrdersController.cs      │   │    │  │ - InventoryController  │   │
│  │  - OrderActionsController   │   │    │  └────────────────────────┘   │
│  └────────────────────────────┘   │         │                             │
│            │                     │         │                             │
│            ▼                     │         ▼                             │
│  ┌────────────────────────────┐   │    ┌────────────────────────┐       │
│  │   MediatR Commands/Queries │   │    │   MediatR Commands/    │       │
│  │  - CreateOrder            │   │    │    Queries             │       │
│  │  - Pickup/Receive/Sort    │   │    │  - CreateInventoryItem │       │
│  │  - Dispatch/Deliver/Fail  │   │    │  - ReserveStock       │       │
│  └────────────────────────────┘   │    │  - GetInventoryBySku  │       │
│            │                     │    └────────────────────────┘       │
│            ▼                     │             │                         │
│  ┌────────────────────────────┐   │             ▼                     │
│  │   Domain Layer (Order)     │   │    ┌────────────────────────┐       │
│  │  - Order Aggregate         │   │    │   Domain Layer        │       │
│  │  - State Machine (14 steps)│   │    │  - InventoryItem      │       │
│  │  - Domain Events          │   │    │  - Warehouse/Zone/Bin  │       │
│  └────────────────────────────┘   │    │  - InboundReceipt     │       │
│            │                     │    └────────────────────────┘       │
│            ▼                     │                                      │
│  ┌────────────────────────────┐   │    ┌────────────────────────┐       │
│  │  Event Handlers            │   │    │   Consumers            │       │
│  │  (Domain → Integration)     │   │    │  - OrderCreatedConsumer│      │
│  └────────────────────────────┘   │    │   (Logging only)      │       │
│            │                     │    └────────────────────────┘       │
│            ▼                     │                                      │
│  ┌────────────────────────────┐   │    ┌────────────────────────┐       │
│  │  MassTransit               │   │    │   MassTransit           │       │
│  │  - Publishes Events        │───┼───►│   - Consumes Events     │       │
│  │  - Sagas/StateMachine      │   │    │   - Outbox Pattern      │       │
│  │  - Outbox Pattern         │   │    └────────────────────────┘       │
│  └────────────────────────────┘   │                                      │
│                                    │                                      │
│  ┌────────────────────────────┐   │                                      │
│  │  Consumers (Internal)     │   │                                      │
│  │  - OrderStatusChanged      │   │                                      │
│  │    Consumer (SignalR)      │   │                                      │
│  └────────────────────────────┘   │                                      │
└────────────────────────────────────┘    └────────────────────────────────┘
```

---

## 1. Order Creation Flow

### 1.1 API Entry Point

**File:** `src/Services/Ordering/Ordering.Api/Controllers/OrdersController.cs` (Lines 24-46)

```
POST /api/orders
Authorization: Bearer {jwt_token}

Request Body:
{
  "consignee": {
    "fullName": "Nguyen Van B",
    "phone": "0909123456",
    "address": {
      "street": "123 Tran Phu",
      "city": "Ho Chi Minh",
      "state": "District 5",
      "country": "Vietnam",
      "zipCode": "700000"
    }
  },
  "codAmount": 500000,
  "shippingFee": 30000,
  "weight": 2.5,
  "note": "Fragile items"
}
```

**Controller Code:**
```csharp
[HttpPost]
public async Task<ActionResult<Result<Guid>>> Create(CreateOrderCommand command)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Anonymous";
    var finalCommand = command with { ConsignorId = userId };
    
    var result = await _mediator.Send(finalCommand);
    return CreatedAtAction(nameof(Get), new { id = result.Value }, result);
}
```

### 1.2 Command Validation

**File:** `src/Services/Ordering/Ordering.Application/Commands/CreateOrder/CreateOrderCommandValidator.cs` (Lines 1-36)

- ConsignorId must not be empty
- Consignee info required (name, phone, address)
- Address requires street and city
- COD amount must be >= 0
- Weight must be > 0

### 1.3 Command Handler

**File:** `src/Services/Ordering/Ordering.Application/Commands/CreateOrder/CreateOrderCommandHandler.cs` (Lines 18-61)

```csharp
public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
{
    // 1. Build Consignee Value Object
    var address = new Address(request.Consignee.Address.Street, ...);
    var consignee = new Consignee(request.Consignee.FullName, request.Consignee.Phone, address);

    // 2. Create Order Aggregate (auto-generates WaybillCode)
    var orderResult = Order.Create(consignorId, consignee, codAmount, shippingFee, weight, note);
    
    // 3. Auto-confirm (validate -> AwaitingPickup)
    var confirmResult = order.Confirm();
    
    // 4. Persist
    _context.Orders.Add(order);
    await _context.SaveChangesAsync(cancellationToken);
    
    return Result<Guid>.Success(order.Id);
}
```

### 1.4 Domain Layer - Order Aggregate

**File:** `src/Services/Ordering/Ordering.Domain/Entities/Order.cs`

**Order.Create()** (Lines 46-78):
- Validates COD >= 0 and Weight > 0
- Generates WaybillCode: `LMS{yyMMddHHmmss}{random4digits}`
- Sets Status = `OrderStatus.New`
- Adds `OrderCreatedDomainEvent`

**Order.Confirm()** (Lines 83-91):
- Transitions: `New` -> `AwaitingPickup`
- Adds tracking timestamp

**Order Entity Properties:**
```csharp
public string ConsignorId { get; }           // Sender (Shop/Vendor)
public Consignee Consignee { get; }         // Receiver value object
public string WaybillCode { get; }          // Auto-generated: LMS{timestamp}{random}
public OrderStatus Status { get; private set; }
public decimal CodAmount { get; }           // Cash on Delivery amount
public decimal ShippingFee { get; }
public decimal Weight { get; }

// Tracking fields
public string? PickupDriverId { get; }
public string? WarehouseId { get; }
public string? DestinationHubId { get; }
public string? DeliveryDriverId { get; }
public string? RouteId { get; }
public string? ProofOfDeliveryUrl { get; }
public string? FailureReason { get; }
public int DeliveryAttempts { get; }
```

### 1.5 Database Persistence

**File:** `src/Services/Ordering/Ordering.Infrastructure/Persistence/ApplicationDbContext.cs`

```csharp
public DbSet<Order> Orders => Set<Order>();

public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
{
    await _mediator.DispatchDomainEvents(this);  // Dispatches domain events
    return await base.SaveChangesAsync(cancellationToken);
}
```

**File:** `src/Services/Ordering/Ordering.Infrastructure/Persistence/MediatorExtensions.cs` (Lines 9-27)

```csharp
public static async Task DispatchDomainEvents(this IMediator mediator, DbContext context)
{
    // 1. Collect all entities with domain events
    // 2. Extract domain events
    // 3. Clear events from entities
    // 4. Publish each domain event via MediatR
    foreach (var domainEvent in domainEvents)
    {
        await mediator.Publish(domainEvent);
    }
}
```

### 1.6 Domain Events -> Integration Events Bridge

**File:** `src/Services/Ordering/Ordering.Application/Features/Orders/EventHandlers/OrderCreatedEventHandler.cs`

```csharp
public class OrderCreatedEventHandler : INotificationHandler<OrderCreatedDomainEvent>
{
    public async Task Handle(OrderCreatedDomainEvent notification, CancellationToken cancellationToken)
    {
        // Publishes Integration Event to RabbitMQ
        await _publishEndpoint.Publish(new OrderCreatedIntegrationEvent(
            notification.OrderId, 
            notification.WaybillCode, 
            notification.ConsignorId, 
            notification.CodAmount), cancellationToken);
    }
}
```

### 1.7 Integration Event Published

**File:** `src/BuildingBlocks/EventBus.Messages/Events/OrderCreatedIntegrationEvent.cs` (Lines 5-9)

```csharp
public record OrderCreatedIntegrationEvent(
    Guid OrderId, 
    string WaybillCode, 
    string ConsignorId, 
    decimal CodAmount) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
```

### 1.8 MassTransit Configuration

**File:** `src/Services/Ordering/Ordering.Infrastructure/DependencyInjection.cs` (Lines 25-56)

```csharp
services.AddMassTransit(busConfigurator =>
{
    busConfigurator.AddConsumers(typeof(IApplicationDbContext).Assembly);
    
    // Saga State Machine
    busConfigurator.AddSagaStateMachine<OrderFulfillmentStateMachine, OrderState>()
        .EntityFrameworkRepository(r => {
            r.ConcurrencyMode = ConcurrencyMode.Pessimistic;
            r.UsePostgres();
            r.ExistingDbContext<ApplicationDbContext>();
        });
    
    // Outbox Pattern for reliability
    busConfigurator.AddEntityFrameworkOutbox<ApplicationDbContext>(o => {
        o.QueryDelay = TimeSpan.FromSeconds(1);
        o.UsePostgres();
        o.UseBusOutbox();
    });
    
    busConfigurator.UsingRabbitMq((context, cfg) => {
        cfg.Host(configuration["MessageBroker:RabbitMQ:Host"], "/", h => {
            h.Username(...);
            h.Password(...);
        });
        cfg.ConfigureEndpoints(context);
    });
});
```

---

## 2. Order State Machine

### 2.1 All Possible States

**File:** `src/Services/Ordering/Ordering.Domain/Enums/OrderStatus.cs` (Lines 1-20)

```csharp
public enum OrderStatus
{
    New = 1,               // Consignor created order
    Confirmed = 2,          // Validated, WaybillCode generated (NOTE: Not used in flow)
    AwaitingPickup = 3,     // Waiting for shipper to pick up
    PickedUp = 4,           // Shipper scanned barcode
    AwaitingInbound = 5,    // En route to warehouse (defined but not used)
    InWarehouse = 6,        // Warehouse staff received
    Sorting = 7,            // Sorting by zone (defined but not used)
    AwaitingDispatch = 8,  // Waiting for route approval
    Dispatched = 9,         // Manager assigned driver
    Delivering = 10,        // Driver en route to deliver (defined but not used)
    Delivered = 11,         // Driver confirmed successful delivery
    Completed = 12,         // COD reconciled (defined but not used)
    Failed = 13,           // Delivery failed
    Cancelled = 14,        // Order cancelled
    ReturnInTransit = 15   // Returning to consignor (defined but not used)
}
```

### 2.2 State Transitions

**File:** `src/Services/Ordering/Ordering.Domain/Entities/Order.cs`

| Current State | Action | Next State | Triggered By | Method |
|---------------|--------|------------|--------------|--------|
| New | Confirm | AwaitingPickup | System (auto) | Order.Confirm() L83 |
| AwaitingPickup | Pickup | PickedUp | Shipper | Order.MarkPickedUp() L96 |
| PickedUp | Receive | InWarehouse | Warehouse Staff | Order.MarkInWarehouse() L112 |
| InWarehouse | Sort | AwaitingDispatch | Warehouse Staff | Order.MarkSorted() L128 |
| AwaitingDispatch | Dispatch | Dispatched | Manager | Order.MarkDispatched() L144 |
| Dispatched | Deliver | Delivered | Driver | Order.MarkDelivered() L161 |
| Dispatched | Fail | Failed | Driver | Order.MarkFailed() L178 |
| Failed | Dispatch | Dispatched | Manager | (re-dispatch) |
| Any before Dispatched | Cancel | Cancelled | Customer/Admin | Order.Cancel() L195 |

### 2.3 Validation Rules

**File:** `src/Services/Ordering/Ordering.Domain/Errors/DomainErrors.cs` (Lines 1-16)

**Cancel Logic** (Order.cs Line 195-205):
```csharp
public Result Cancel()
{
    // Can only cancel before Dispatched (or if Failed)
    if (Status >= OrderStatus.Dispatched && Status != OrderStatus.Failed)
        return Result.Failure(DomainErrors.Order.CannotCancel);
    
    Status = OrderStatus.Cancelled;
    ...
}
```

---

## 3. OMS ↔ WMS Integration

### 3.1 Integration Events Published by OMS

**File:** `src/BuildingBlocks/EventBus.Messages/Events/`

| Event | Data | Published When |
|-------|------|----------------|
| `OrderCreatedIntegrationEvent` | OrderId, WaybillCode, ConsignorId, CodAmount | Order created |
| `ShipmentPickedUpIntegrationEvent` | OrderId, DriverId | Driver picks up |
| `ShipmentReceivedIntegrationEvent` | OrderId, WarehouseId, ReceivedBy | Warehouse receives |
| `ShipmentSortedIntegrationEvent` | OrderId, DestinationHubId | Sorted by zone |
| `RouteDispatchedIntegrationEvent` | OrderId, DriverId, RouteId | Manager assigns driver |
| `DeliveryCompletedIntegrationEvent` | OrderId, ProofOfDeliveryUrl | Delivery success |
| `DeliveryFailedIntegrationEvent` | OrderId, Reason, AttemptNumber | Delivery failure |

### 3.2 WMS Consumers

**File:** `src/Services/Warehouse/Warehouse.Application/Features/Inventory/Consumers/OrderCreatedConsumer.cs`

```csharp
public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    public Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        // WMS receives the event but only LOGS it
        _logger.LogInformation(
            "WMS: Received notification — Order {OrderId} (Waybill: {WaybillCode}) created...",
            message.OrderId, message.WaybillCode, message.ConsignorId, message.CodAmount);
        
        // NOTE: No actual inventory reservation happens
        // Physical inbound processing happens via OMS API (MarkInWarehouse)
        return Task.CompletedTask;
    }
}
```

### 3.3 WMS Inventory System

The WMS has:
- `CreateInventoryItemCommand` - Create inventory by SKU
- `ReserveStockCommand` - Reserve stock (but NOT called during order creation)
- `GetInventoryBySkuQuery` - Check inventory levels

**Key Finding:** WMS does NOT automatically reserve inventory when orders are created. The `OrderCreatedConsumer` only logs the notification.

### 3.4 Dead Letter Queue / Fallback Mechanism

**Finding:** There is NO explicit Dead Letter Queue configuration or fallback mechanism found in the codebase.

MassTransit's default behavior:
- If a consumer fails, messages are retried
- After max retries, messages go to MassTransit's default error queue
- No custom error handling or fallback logic implemented

---

## 4. Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ORDER LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

1. CREATE ORDER
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ CreateOrderCmd   │ ───► │ Order.Create()    │
   │ POST     │      │ (Validator)      │      │ - Generate Waybill│
   │ /orders  │      └──────────────────┘      │ - Status = New   │
   └──────────┘                                 │ - AddDomainEvent │
                                                 └────────┬────────┘
                                                          │
                                                          ▼
                                                 ┌───────────────────┐
                                                 │ order.Confirm()   │
                                                 │ Status = Awaiting │
                                                 │        Pickup     │
                                                 └────────┬──────────┘
                                                          │
                                                          ▼
                                                 ┌───────────────────┐
                                                 │ SaveChangesAsync  │
                                                 │ - DispatchDomain   │
                                                 │   Events           │
                                                 └────────┬──────────┘
                                                          │
                                                          ▼
                                                 ┌───────────────────┐
                                                 │ OrderCreatedEvent │
                                                 │ Handler           │
                                                 │ - Publish to      │
                                                 │   RabbitMQ         │
                                                 └────────┬──────────┘
                                                          │
                    ┌─────────────────────────────────────┼─────────────────┐
                    │                                     │                 │
                    ▼                                     ▼                 ▼
           ┌──────────────────┐              ┌────────────────┐    ┌─────────────┐
           │ OMS Saga         │              │ OMS Consumer   │    │ WMS Consumer│
           │ (OrderState)     │              │ (SignalR Push) │    │ (Log only)  │
           └──────────────────┘              └────────────────┘    └─────────────┘


2. PICKUP FLOW
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ PickupOrderCmd   │ ───► │ order.MarkPickedUp│
   │ PUT      │      │                  │      │ Status = PickedUp │
   │ /pickup  │      └──────────────────┘      └────────┬──────────┘
   └──────────┘                                        │
                                                         ▼
                                                Integration Event ─► RabbitMQ


3. WAREHOUSE RECEIVE
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ ReceiveOrderCmd   │ ───► │ order.MarkIn      │
   │ PUT      │      │                  │      │ Warehouse()       │
   │ /receive │      └──────────────────┘      │ Status = InWarehouse
                                                 └────────┬──────────┘
                                                          │
                                                          ▼
                                                Integration Event ─► RabbitMQ


4. SORT
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ SortOrderCmd     │ ───► │ order.MarkSorted()│
   │ PUT      │      │                  │      │ Status = Awaiting │
   │ /sort    │      └──────────────────┘      │        Dispatch   │
                                                 └───────────────────┘


5. DISPATCH
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ DispatchOrderCmd │ ───► │ order.MarkDispatch│
   │ PUT      │      │                  │      │ Status = Dispatched
   │ /dispatch│      └──────────────────┘      └────────┬──────────┘
   └──────────┘                                        │
                                                         ▼
                                                Integration Event ─► RabbitMQ
                                                          │
                    ┌─────────────────────────────────────┼─────────────────┐
                    │                                     │                 │
                    ▼                                     ▼                 ▼
           ┌──────────────────┐              ┌────────────────┐    ┌─────────────┐
           │ OMS Saga         │              │ OMS Consumer   │    │ WMS Consumer│
           │ (Track Driver)   │              │ (SignalR Push)│    │             │
           └──────────────────┘              └────────────────┘    └─────────────┘


6. DELIVERY
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ DeliverOrderCmd  │ ───► │ order.MarkDelivered│
   │ PUT      │      │ (or FailDelivery)│      │ Status = Delivered│
   │ /deliver │      └──────────────────┘      │ or Failed         │
   └──────────┘                                        │
                                                         ▼
                                                Integration Event ─► RabbitMQ
                                                          │
                    ┌─────────────────────────────────────┼─────────────────┐
                    │                                     │                 │
                    ▼                                     ▼                 ▼
           ┌──────────────────┐              ┌────────────────┐    ┌─────────────┐
           │ OMS Saga         │              │ OMS Consumer   │    │ WMS Consumer│
           │ (Completed or    │              │ (SignalR Push) │    │             │
           │  DeliveryFailed) │              │                │    │             │
           └──────────────────┘              └────────────────┘    └─────────────┘


7. FAILED DELIVERY (Retry)
   ┌──────────┐      ┌──────────────────┐      ┌───────────────────┐
   │ REST API │ ───► │ FailDeliveryCmd  │ ───► │ order.MarkFailed() │
   │ PUT      │      │                  │      │ Status = Failed    │
   │ /fail    │      └──────────────────┘      └────────┬──────────┘
   └──────────┘                                        │
         │                                             │
         │         Re-dispatch flow (step 5)           │
         └────────────────────────────────────────────►┘
```

---

## 5. Key Files Summary

| Component | File Path |
|-----------|-----------|
| **Controllers** | |
| Orders Controller | `src/Services/Ordering/Ordering.Api/Controllers/OrdersController.cs` |
| Order Actions Controller | `src/Services/Ordering/Ordering.Api/Controllers/OrderActionsController.cs` |
| Inventory Controller (WMS) | `src/Services/Warehouse/Warehouse.Api/Controllers/InventoryController.cs` |
| **Commands** | |
| Create Order Command | `src/Services/Ordering/Ordering.Application/Commands/CreateOrder/CreateOrderCommand.cs` |
| Create Order Handler | `src/Services/Ordering/Ordering.Application/Commands/CreateOrder/CreateOrderCommandHandler.cs` |
| Order Action Commands | `src/Services/Ordering/Ordering.Application/Commands/OrderActions/OrderActionCommands.cs` |
| Order Action Handlers | `src/Services/Ordering/Ordering.Application/Commands/OrderActions/OrderActionCommandHandlers.cs` |
| **Domain** | |
| Order Aggregate | `src/Services/Ordering/Ordering.Domain/Entities/Order.cs` |
| Order Status Enum | `src/Services/Ordering/Ordering.Domain/Enums/OrderStatus.cs` |
| OrderItem | `src/Services/Ordering/Ordering.Domain/Entities/OrderItem.cs` |
| Consignee Value Object | `src/Services/Ordering/Ordering.Domain/ValueObjects/Consignee.cs` |
| Address Value Object | `src/Services/Ordering/Ordering.Domain/ValueObjects/Address.cs` |
| Domain Errors | `src/Services/Ordering/Ordering.Domain/Errors/DomainErrors.cs` |
| **Domain Events** | |
| All Domain Events | `src/Services/Ordering/Ordering.Domain/Events/OrderCreatedDomainEvent.cs` |
| **Event Handlers** | |
| Domain→Integration Bridge | `src/Services/Ordering/Ordering.Application/Features/Orders/EventHandlers/OrderCreatedEventHandler.cs` |
| **Sagas** | |
| State Machine | `src/Services/Ordering/Ordering.Application/Sagas/OrderFulfillment/OrderFulfillmentStateMachine.cs` |
| Saga State | `src/Services/Ordering/Ordering.Application/Sagas/OrderFulfillment/OrderState.cs` |
| **Integration Events** | |
| All Integration Events | `src/BuildingBlocks/EventBus.Messages/Events/OrderCreatedIntegrationEvent.cs` |
| **Consumers** | |
| WMS OrderCreated Consumer | `src/Services/Warehouse/Warehouse.Application/Features/Inventory/Consumers/OrderCreatedConsumer.cs` |
| OMS Notification Consumer | `src/Services/Ordering/Ordering.Application/Features/Notifications/Consumers/OrderStatusChangedConsumer.cs` |
| **Infrastructure** | |
| OMS MassTransit Config | `src/Services/Ordering/Ordering.Infrastructure/DependencyInjection.cs` |
| WMS MassTransit Config | `src/Services/Warehouse/Warehouse.Infrastructure/DependencyInjection.cs` |
| OMS DbContext | `src/Services/Ordering/Ordering.Infrastructure/Persistence/ApplicationDbContext.cs` |
| WMS DbContext | `src/Services/Warehouse/Warehouse.Infrastructure/Persistence/WMSDbContext.cs` |
| **Notifications** | |
| SignalR Service | `src/Services/Ordering/Ordering.Api/Services/SignalRNotificationService.cs` |
| OrderHub | `src/Services/Ordering/Ordering.Api/Hubs/OrderHub.cs` |
| **Configuration** | |
| Order EF Config | `src/Services/Ordering/Ordering.Infrastructure/Persistence/Configurations/OrderConfiguration.cs` |
| OMS appsettings | `src/Services/Ordering/Ordering.Api/appsettings.Development.json` |
| WMS appsettings | `src/Services/Warehouse/Warehouse.Api/appsettings.json` |
| BFF Proxy Config | `src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api/appsettings.json` |
| Docker Compose | `deploy/docker/docker-compose.local.yml` |

---

## 6. Critical Gaps & Missing Features

| Gap | Current State | Recommendation |
|-----|--------------|-----------------|
| **WMS Inventory Reservation** | WMS only logs order creation, no auto-reservation | Implement inventory check/reservation on order creation |
| **COD Reconciliation** | COD tracked but never collected/reconciled | Add COD collection API and reconciliation service |
| **Dead Letter Queue** | No explicit DLQ configuration | Configure MassTransit error queues |
| **Driver App** | No driver integration | Create driver mobile app with GPS tracking |
| **Driver Location** | Manual assignment, no proximity calculation | Add geolocation service for driver assignment |
| **Delivery → Inventory** | No inventory update on delivery | Consume delivery events in WMS to update inventory |
| **Warehouse Entities** | Warehouse/Zone/Bin exist but not used | Integrate physical warehouse scanning flow |
| **Return Flow** | `ReturnInTransit` state exists but never used | Implement return shipment flow |
| **Notification Consumers in OMS** | Internal consumers only | Add SMS/Email notification integration |
| **Retry Logic** | Default MassTransit retry | Configure exponential backoff for failed deliveries |
