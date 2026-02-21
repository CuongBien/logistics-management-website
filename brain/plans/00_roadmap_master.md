# Roadmap: Enterprise Logistics Management System (LMS)

## Phase 1: Foundation & Core Services (Months 1-2)

**Goal:** Thiết lập hạ tầng, bảo mật và các service cơ bản.

- [ ] **Infrastructure:** Docker, Kubernetes (Local/Dev), PostgreSQL, RabbitMQ, Redis, Jaeger.
- [ ] **Auth Service:** Keycloak Integration, User Management, Role-based Auth.
- [ ] **Gateway:** YARP Setup, Auth Offloading, Rate Limiting.
- [ ] **Common Lib:** Shared Kernel (Domain Entity, Result Pattern, Event Bus Wrapper).
- [ ] **OMS V1:** Create/View Order (Basic).

## Phase 2: Operations & Warehouse (Months 3-4)

**Goal:** Hoàn thiện luồng vận hành kho và xử lý đơn hàng phức tạp.

- [ ] **WMS Core:** Inventory Management, Bin/Slot, Goods Receipt.
- [ ] **Order Saga:** Orchestration for Order -> Inventory -> Payment.
- [ ] **Mobile App V1:** Basic Driver App (Task List, Status Update).
- [ ] **Notification:** SignalR Integration for Real-time alerts.

## Phase 3: Intelligence & Scale (Months 5-6+)

**Goal:** Tối ưu hóa vận hành và mở rộng quy mô.

- [ ] **TMS Core:** Route Planning, Load Consolidation.
- [ ] **IoT Integration:** GPS Tracking, Temperature Monitoring.
- [ ] **Advanced Analytics:** Heatmaps, Performance Reports.
- [ ] **Scale:** Triển khai KEDA autoscaling, Multi-region DB (nếu cần).
