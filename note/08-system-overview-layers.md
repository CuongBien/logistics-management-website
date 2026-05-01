# System Overview - Logistics Management Website

## 1. What the System Has Now

**Type:** .NET 8 Microservices Backend (API-first, no frontend yet)

### Active Services
| Service | Port | Purpose |
|---------|------|---------|
| Ordering Service (OMS) | 5000 | Order lifecycle management |
| Warehouse Service (WMS) | 5051 | Inventory management |
| BFF Gateway (YARP) | 8000 | Single entry point, routes to services |

### Infrastructure
- **Database:** PostgreSQL 16 + PostGIS (port 56432)
- **Message Broker:** RabbitMQ + MassTransit (port 5672)
- **Authentication:** Keycloak JWT/OIDC (port 18080)
- **Real-time:** SignalR
- **Caching:** Redis (port 6379)
- **Logging:** Serilog + Seq (port 8081)
- **Tracing:** OpenTelemetry + Jaeger (port 16686)

---

## 2. Working Features

### Order Management (OMS)
- Create order with consignor/consignee info
- Full order lifecycle state machine: New → Confirmed → AwaitingPickup → PickedUp → InWarehouse → Sorting → AwaitingDispatch → Dispatched → Delivering → Delivered → Completed
- Driver actions: pickup, receive, sort, dispatch, deliver, fail
- Waybill generation
- COD handling
- Real-time notifications via SignalR

### Warehouse Management (WMS)
- Inventory creation by SKU
- Stock queries by SKU
- Stock reservation
- Warehouse/Zone/Block/Bin hierarchy

### Cross-Cutting
- JWT authentication via Keycloak
- Saga orchestration for multi-step workflows
- Outbox pattern for reliable messaging
- Distributed tracing

---

## 3. How Each Layer Works

Each microservice follows **Clean Architecture** with 4 layers:

### Layer 1: Domain (`*.Domain/`)
- **Entities:** Aggregate roots with business logic
- **Value Objects:** Immutable domain concepts
- **Enums:** OrderStatus, etc.
- **Domain Events:** Internal events
- **Domain Exceptions:** Business rule violations

### Layer 2: Application (`*.Application/`)
- **Commands:** Write operations (CreateOrder, PickupOrder)
- **Queries:** Read operations (GetOrderById)
- **MediatR Handlers:** Process commands/queries
- **Validators:** FluentValidation rules
- **Sagas:** Multi-service workflow orchestrations
- **Behaviors:** Pipeline (logging, validation)

### Layer 3: Infrastructure (`*.Infrastructure/`)
- **DbContext:** EF Core data access
- **Configurations:** Entity mappings
- **Repositories:** Data access abstraction
- **Consumers:** MassTransit event handlers
- **External Adapters:** Third-party integrations

### Layer 4: API (`*.Api/`)
- **Controllers:** HTTP endpoints
- **Hubs:** SignalR real-time endpoints
- **Middleware:** Exception handling
- **Program.cs:** DI wiring

---

## 4. How Layers Work Together

### Request Flow
```
[Client] 
    │
    ▼ HTTP + JWT
[YARP Gateway]
    │
    ▼
[API Layer: Controller]
    │
    ▼ MediatR Request
[Application Layer: Handler]
    │
    ▼ Domain Logic
[Domain Layer: Entity]
    │
    ▼ Data Persist
[Infrastructure: EF Core]
    │
    ▼
[PostgreSQL]
```

### Event Flow (Cross-Service)
```
[Application Handler]
    │
    ▼ Publish Event
[MassTransit Outbox]
    │
    ▼ Transaction Commit
[RabbitMQ]
    │
    ▼ Consume
[Other Service Consumer]
    │
    ▼
[SignalR] → [Real-time Updates] → [Clients]
```

---

## 5. How to Add a New Feature

To add "Driver Management" feature, touch each layer:

### Step 1: Domain Layer
```
Services/Driver/Driver.Domain/
├── Entities/Driver.cs
├── Enums/DriverStatus.cs
└── Events/DriverAssignedEvent.cs
```

### Step 2: Application Layer
```
Services/Driver/Driver.Application/
├── Commands/CreateDriver/
│   ├── CreateDriverCommand.cs
│   └── CreateDriverCommandHandler.cs
├── Queries/GetDriverById/
│   ├── GetDriverByIdQuery.cs
│   └── GetDriverByIdQueryHandler.cs
└── DependencyInjection.cs
```

### Step 3: Infrastructure Layer
```
Services/Driver/Driver.Infrastructure/
├── Persistence/
│   ├── DriverDbContext.cs
│   └── Configurations/DriverConfiguration.cs
├── DependencyInjection.cs
```

### Step 4: API Layer
```
Services/Driver/Driver.Api/
├── Controllers/DriversController.cs
├── Program.cs
└── appsettings.json
```

### Step 5: Cross-Cutting
- Add integration event to `EventBus.Messages/`
- Add MassTransit consumer in Infrastructure
- Add saga state if multi-service workflow
- Update YARP gateway routes

---

## 6. Key Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| CQRS | Application | Separate read/write operations |
| MediatR | Application | Request/handler decoupling |
| Saga | Application | Multi-service workflows |
| Outbox | Infrastructure | Reliable messaging |
| Repository | Infrastructure | Data access abstraction |
| Result/Either | Domain/Core | Functional error handling |
