# Project Summary - Logistics Management System (LMS)

## 1) Purpose
LMS is a microservices-based platform for logistics operations. It currently focuses on order lifecycle and warehouse inventory reservation.

## 2) Main Goals
- Manage customer orders (create, query, confirm, cancel).
- Manage warehouse inventory and reservation.
- Coordinate services through asynchronous messaging.
- Provide centralized API access through gateway.
- Support authentication and authorization.

## 3) High-Level Tech Stack
- Backend: .NET 8
- Architecture: Clean Architecture + DDD
- Messaging: RabbitMQ + MassTransit
- Databases: PostgreSQL (including PostGIS)
- Auth: Keycloak (OIDC/JWT)
- Gateway: YARP
- Observability: Serilog + Seq + Jaeger
- Cache: Redis
- Local runtime: Docker Compose

## 4) Current Business Scope
### OMS (Order Management Service)
- Create order
- Get order details
- Confirm order
- Cancel order

### WMS (Warehouse Management Service)
- Create inventory item
- Get inventory by SKU
- Reserve stock for orders

### Integration Flow
- OMS publishes order events.
- WMS consumes events and reserves inventory.
- Saga tracks fulfillment/reservation states.
- Notifications are sent in real time via SignalR.

## 5) Repository Structure (Top-Level)
- `src/BuildingBlocks/` - shared abstractions and messaging contracts
- `src/Services/OMS/` - order service
- `src/Services/WMS/` - warehouse service
- `src/Services/Gateway/` - API gateway
- `docker-compose.local.yml` - local infrastructure and service orchestration

## 6) Maturity Snapshot
Implemented and usable locally with Docker + .NET 8. The architecture is extensible for future logistics stages such as transport management and delivery progression.
