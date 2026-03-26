# Quick Start and Validation Notes

## 1) Prerequisites
- .NET 8 SDK
- Docker Desktop

## 2) Start Infrastructure
Use the local compose file from repository root.

## 3) Run Services (typical)
- OMS API
- WMS API
- Gateway API

## 4) Suggested Validation Checklist
- OMS Swagger responds
- WMS Swagger responds
- Gateway routes to OMS and WMS
- Keycloak reachable and token issuance works
- RabbitMQ management UI reachable
- Seq and Jaeger reachable
- Reserve inventory flow works end-to-end
- SignalR notifications received on state changes

## 5) Developer Workflow Recommendations
- Create feature branch from active integration branch.
- Keep commits scoped by concern (docs/code/tests).
- Run unit + integration tests before push.
- Preserve event contract compatibility across services.

## 6) Documentation Artifacts Produced
This `note` folder currently includes:
- Project summary
- Software architecture document
- Functional analysis
- Quick start and validation notes
