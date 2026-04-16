# AGENTS.md

## Project Overview

Enterprise Logistics Management System (LMS) - an event-driven microservices platform built with .NET 8, following Clean Architecture and Domain-Driven Design.

**Solution file:** `src/LMS.sln`

## Services & Ports

| Service | Path | Local Dev Port | Docker Port |
|---|---|---|---|
| API Gateway (YARP) | `src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api` | 5200 | 8000 |
| Ordering Service | `src/Services/Ordering/Ordering.Api` | 5000 | 5000 |
| Warehouse Service | `src/Services/Warehouse/Warehouse.Api` | 5051 | 5051 |

Swagger endpoints via gateway: `http://localhost:5200/api/ordering/swagger` and `http://localhost:5200/api/warehouse/swagger`

## How to Run

There are two approaches: **Local Development** (recommended for coding) or **Full Docker**.

### Option A: Local Development (Recommended)

This runs infrastructure via Docker but application services via `dotnet run` for hot-reload debugging.

**Step 1: Start Infrastructure Only**
```bash
cd deploy/docker
docker-compose -f docker-compose.local.yml up -d postgres rabbitmq redis keycloak seq jaeger mailhog
```
Wait ~15-30s for services to be healthy.

**Step 2: Run Application Services (3 separate terminals)**

Terminal 1 - Ordering Service:
```bash
cd src
dotnet run --project Services/Ordering/Ordering.Api
```

Terminal 2 - Warehouse Service:
```bash
cd src
dotnet run --project Services/Warehouse/Warehouse.Api
```

Terminal 3 - API Gateway:
```bash
cd src
dotnet run --project ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api
```

### Option B: Full Docker (No local .NET required)

Builds and runs everything in Docker containers.

```bash
cd deploy/docker
docker-compose -f docker-compose.local.yml build
docker-compose -f docker-compose.local.yml up -d
```

> **Note:** If images fail to pull from Docker Hub, the images are built locally on first run.

### Infrastructure Endpoints
- Keycloak Admin: `http://localhost:18080` (user: `admin`, pass: `admin`)
- RabbitMQ Management: `http://localhost:15672` (user: `lms`, pass: `lms123`)
- Jaeger UI: `http://localhost:16686`
- Seq: `http://localhost:8081`

## Database Setup

Two separate Postgres databases (schemas, not separate servers):
- `lms_oms_dev` - Ordering service data
- `lms_wms_dev` - Warehouse service data

Local Postgres exposed on port **56432** (not the default 5432).

**Migrations run automatically on startup** (see `Program.cs` - `context.Database.Migrate()`). Do NOT run `dotnet ef migrations add` from the Api project unless you also update the DbContext location.

## Key Architectural Patterns

### Saga Orchestration (Ordering Service)
- Located in `src/Services/Ordering/Ordering.Application/Sagas/OrderFulfillment/`
- `OrderFulfillmentStateMachine` + `OrderState` entity drives the saga
- `CorrelationId` on `OrderState` MUST equal `OrderId`
- Saga state stored in DB with **Pessimistic concurrency** (`ConcurrencyMode.Pessimistic`)

### Outbox Pattern
- Configured in `Ordering.Infrastructure/DependencyInjection.cs` and `Warehouse.Infrastructure/DependencyInjection.cs`
- MassTransit hooks into EF Core via `UseBusOutbox()` - intercepts `SaveChanges()` transparently
- **Use `IPublishEndpoint.Publish()` normally** - do NOT avoid it. The bus outbox intercepts at `SaveChanges()` and writes to the outbox table instead of sending directly over the network
- This prevents dual-write failures (DB commit + MQ publish must be atomic)

### Result Pattern (Building Block)
- Located in `src/BuildingBlocks/Logistics.Core/Result.cs`
- `Result<T>.Success(value)` / `Result<T>.Failure(error)` pattern used across all services
- Errors defined in `*.Domain/Errors/DomainErrors.cs`

### Optimistic Concurrency (Warehouse)
- Warehouse uses **OCC via PostgreSQL RowVersion** (xmin equivalent)
- EF Core maps `InventoryItem.Version` to `xmin` for optimistic locking
- `DbUpdateConcurrencyException` thrown on race condition

### SignalR Real-time
- `Ordering.Api/Hubs/OrderHub.cs` - hub for order notifications
- SignalR auth via query string token (`?access_token=...`)
- Allowed origins include `null` (file:// testing) and `http://localhost:5000`

### JWT / Keycloak Auth
- Valid issuers in development (3 variants to handle container vs local):
  - `http://localhost:8080/realms/logistics_realm`
  - `http://localhost:18080/realms/logistics_realm`
  - `http://keycloak:8080/realms/logistics_realm`
- `ValidateAudience: false` in dev
- `realm_access.roles` from Keycloak mapped to `ClaimTypes.Role`
- Audience: `oms-client`

## Common Mistakes to Avoid

- **Do not assume one database.** Each service owns its own schema (`lms_oms_dev` vs `lms_wms_dev`). Cross-service references use UUIDs only (no FK).
- **Do not publish events directly to RabbitMQ.** Use the Outbox pattern via MassTransit's bus outbox. Use `IPublishEndpoint.Publish()` normally - the outbox handles the rest transparently at `SaveChanges()`.
- **Do not change Saga correlation IDs.** The `CorrelationId` on `OrderState` must always match the `OrderId`.
- **Docker-compose and local ports differ.** Services run on different ports inside containers vs on your local machine. Check `docker-compose.local.yml` for container networking (e.g., services refer to each other by container name like `postgres`, `rabbitmq`, `keycloak`).
- **PostgreSQL port is 56432 locally.** The local development connection string uses port 56432, not the default 5432. Inside Docker containers, services connect via `postgres:5432`.
- **Port numbers may differ between local debug and Docker.** The launchSettings.json shows local Kestrel ports (5000, 5051, 5200) which are used for local development. Docker-compose and documentation reference canonical ports for containerized runs. Use the service-specific guidance above for local development.
- **WMS participates in real-time via event publishing.** While Ordering.Api hosts the SignalR Hub, WMS publishes integration events to RabbitMQ that Ordering consumes to push notifications. When modifying WMS, ensure events are published for real-time updates.

## Build Commands

```bash
# Build entire solution
dotnet build src/LMS.sln

# Build single project
dotnet build src/Services/Ordering/Ordering.Api/Ordering.Api.csproj

# Watch mode
dotnet watch --project src/Services/Ordering/Ordering.Api
```

## Project Structure

```
src/
├── BuildingBlocks/
│   ├── Logistics.Core/       # Result pattern, base classes (Entity, IAggregateRoot)
│   └── EventBus.Messages/     # Shared integration event DTOs
├── Services/
│   ├── Ordering/
│   │   ├── Ordering.Api/          # Presentation (Controllers, Hubs, SignalR)
│   │   ├── Ordering.Application/  # Use cases, MediatR handlers, Saga
│   │   ├── Ordering.Domain/       # Entities, Value Objects, Domain Events
│   │   └── Ordering.Infrastructure/ # EF Core, MassTransit, Repositories
│   └── Warehouse/
│       └── (same 4-layer structure)
└── ApiGateways/
    └── Web.Bff.Logistics/        # YARP reverse proxy gateway
```

## Documentation

Full technical docs in `docs/`:
- `docs/system_architecture.md` - Architecture overview
- `docs/db_architecture.md` - Database schema details
- `docs/checklist/` - 14-chapter training series (Bài 1-14)
