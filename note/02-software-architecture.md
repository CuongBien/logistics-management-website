# Software Architecture Document

## 1) Architectural Style
- Microservices architecture
- Domain-Driven Design (DDD)
- Clean Architecture per service
- Event-driven communication between services

## 2) Bounded Contexts and Services
- **OMS**: order domain and lifecycle handling
- **WMS**: inventory domain and stock reservation
- **Gateway**: single external entry via reverse proxy (YARP)
- **BuildingBlocks**: shared domain and messaging primitives

## 3) Internal Layering (per service)
- **Domain**: entities, value objects, domain events
- **Application**: use cases, CQRS handlers, contracts
- **Infrastructure**: persistence, bus wiring, external adapters
- **API**: controllers/endpoints, auth, middleware, docs

## 4) Integration and Messaging
- Message broker: RabbitMQ
- Framework: MassTransit
- Pattern: async integration events + consumers
- Reliability: Outbox pattern (EF + MassTransit outbox)

## 5) Long-Running Process Management
Saga orchestration is used for order fulfillment progression:
1. Order created in OMS
2. Event published
3. WMS attempts reservation
4. Success/failure event emitted
5. Saga state transitions to completed/faulted path

## 6) Security Model
- Identity provider: Keycloak
- Access token: JWT bearer
- API authorization through role-based claims
- SignalR supports token flow for authenticated realtime channels

## 7) Observability and Operations
- Logging: Serilog, aggregated in Seq
- Tracing: Jaeger
- Health checks available in gateway/service endpoints

## 8) Deployment Topology (Local)
Docker Compose provisions infrastructure components (DBs, RabbitMQ, Redis, Keycloak, observability stack) and service containers.

## 9) Risks and Recommendations
- Add API contract versioning policy.
- Add end-to-end integration tests around event flows.
- Add failure compensation strategy for all saga branches.
- Define SLA/SLO for key endpoints and event latency.
