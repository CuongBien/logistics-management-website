# Done Log: Sprint 2 (OMS Core)

## Completed Tasks

### 1. Domain Layer Implementation

- **Order Aggregate:**
  - Implemented `Create`, `Confirm`, `Cancel` logic.
  - Enforced Business Rules (e.g., Cannot cancel unless New/Confirmed).
  - Used `Result` pattern (BuildingBlocks) for operations.
- **Domain Events:**
  - Implemented `OrderCreatedDomainEvent` and `OrderCancelledDomainEvent`.
  - Events are raised from Aggregate Root.
- **Value Objects & Enums:**
  - Updated `OrderStatus` to match State Machine.
  - Confirmed usage of `Address`, `Money`.
  - Added `DomainErrors` for standardized error codes.

### 2. Infrastructure Layer Implementation

- **EF Core Configuration:**
  - Mapped `Order` and `OrderItem` to Postgres tables using `IEntityTypeConfiguration`.
  - Configured Ownership for `Address` and `Money`.
- **DbContext:**
  - Updated `ApplicationDbContext` to implement `IApplicationDbContext`.
  - Overrode `SaveChangesAsync` to dispatch Domain Events via MediatR (using `MediatorExtensions`).
- **Resiliency & Messaging:**
  - Configured **MassTransit Transactional Outbox** with Postgres.
  - Ensured events are saved atomically with business data.
- **Database Schema:**
  - Generated and applied `InitialCreate` migration.
  - Tables created: `Orders`, `OrderItems`, `OutboxMessage`, `InboxState`, `OutboxState`.

### 3. Application Layer & Messaging Implementation

- **Building Blocks:**
  - Created `BuildingBlocks.Messaging` for shared Integration Events.
  - Implemented `IntegrationEvent` and `OrderCreatedIntegrationEvent`.
- **Create Order Feature:**
  - Updated `CreateOrderCommand` to support `Items`.
  - Implemented `CreateOrderCommandHandler` with Domain Logic mapping.
  - Added FluentValidation rules for Order and Items.
- **Get Order Feature:**
  - Implemented `GetOrderByIdQuery` using EF Core `AsNoTracking` for performance.
  - Mapped result to `OrderDto`.
- **Event Handling:**
  - Implemented `OrderCreatedEventHandler` to bridge Domain Events to RabbitMQ via MassTransit Outbox.
- **API:**
  - Exposed `POST /api/orders` and `GET /api/orders/{id}` endpoints.

### 4. Technical Debts (Cross-Cutting Concerns)

- **Global Exception Handling:**
  - Implemented `GlobalExceptionHandler` to standardize API error responses.
  - Handles `ValidationException` (400) and `KeyNotFoundException` (404).
- **Pipeline Behaviors:**
  - Implemented `ValidationBehavior` to automate validation.
  - Implemented `LoggingBehavior` for request observability.

## Next Steps

- **Sprint 3:** Inventory Management & Integration with Warehouse Service.
- **Testing:** Comprehensive Unit & Integration Tests.
