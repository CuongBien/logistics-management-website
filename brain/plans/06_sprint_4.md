# Sprint 4: API Gateway & Containerization

**Goal:** Hoàn thiện hạ tầng deployment với Docker Compose và API Gateway (YARP) cho cả 2 services OMS & WMS.

## 1. API Gateway (YARP) (`src/ApiGateways`)

Hiện tại Gateway chỉ đang route cho OMS. Cần bổ sung WMS.

- [ ] **Configure WMS Route:**
  - Path: `/api/wms/{**catch-all}`
  - Cluster: `wms-cluster` -> `http://wms.api:8080` (Docker) hoặc `http://localhost:5051` (Local).
- [ ] **Global Configuration:**
  - CORS Policy.
  - Authentication/Authorization Middleware (Keycloak Token Validation tại Gateway).

## 2. Containerization (Docker)

Đóng gói các service thành container để chạy đồng bộ.

- [ ] **Dockerfile:** Tạo Dockerfile tối ưu cho `WMS.Api`.
- [ ] **Docker Compose:**
  - Update `docker-compose.local.yml` (hoặc tạo file mới `docker-compose.app.yml`).
  - Add Service `wms.api`.
  - Add Service `gateway.api`.
  - Ensure Network Alias (`oms`, `wms`, `gateway`) để internal routing hoạt động.

## 3. Resilience & Observability

- [ ] **HealthChecks:**
  - Add `/health` endpoint cho WMS & Gateway.
  - Configure Docker Healthcheck.
- [ ] **Logging:**
  - Ensure Gateway push logs to Seq.

## Done Criteria

1. Chạy lệnh `docker-compose up -d --build` -> Hệ thống start thành công hoàn toàn.
2. Truy cập được Swagger của từng service qua Gateway (nếu config route Swagger) hoặc gọi API qua Postman:
   - `POST http://localhost:8080/api/oms/orders`
   - `POST http://localhost:8080/api/wms/inventory`
3. Load Balancing: (Optional) Chạy 2 replica của WMS và test round-robin.
